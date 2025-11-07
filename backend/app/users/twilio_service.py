"""Twilio integration for OTP verification"""
import logging
import asyncio
from typing import Dict
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from fastapi import HTTPException, status
from app.config import settings

# Configure logger
logger = logging.getLogger(__name__)


class TwilioService:
    """Service for working with Twilio Verify API"""
    
    def __init__(self):
        """Initialize Twilio client"""
        try:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            self.verify_service_sid = settings.TWILIO_VERIFY_SERVICE_SID
            logger.info("Twilio client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {str(e)}")
            raise
    
    async def send_otp(self, phone_number: str) -> Dict[str, any]:
        """
        Send OTP code to the specified phone number using Twilio Verify API.
        
        Args:
            phone_number: Phone number in E.164 format (e.g., +77771234567)

        Returns:
            Dict with information about the sending:
            {
                "success": True,
                "message": "OTP sent successfully",
                "phone_number": "+77771234567"
            }
        
        Raises:
            HTTPException: При ошибках Twilio или сети
        """
        
        try:
            logger.info(f"Attempting to send OTP to {phone_number}")

            # Run in a separate thread
            # to avoid blocking FastAPI's event loop
            verification = await asyncio.to_thread(
                self._send_otp_sync,
                phone_number
            )
            
            logger.info(f"OTP sent successfully to {phone_number}. SID: {verification.sid}")
            
            return {
                "success": True,
                "message": "OTP sent successfully",
                "phone_number": phone_number
            }
            
        except TwilioRestException as e:
            # Handle specific Twilio errors
            logger.error(f"Twilio error for {phone_number}: {e.code} - {e.msg}")
            
            # different Twilio error codes
            if e.code == 60200:  # Invalid phone number
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            elif e.code == 60203:  # Max send attempts reached
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many attempts. Please try again later."
                )
            elif e.code == 20003:  # Authentication error
                logger.critical("Twilio authentication failed! Check credentials.")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Service temporarily unavailable"
                )
            else:
                # General Twilio error (do not disclose details to client)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send OTP. Please try again."
                )
        
        except Exception as e:
            # Handle unexpected errors (network issues, timeouts, etc.)
            logger.exception(f"Unexpected error sending OTP to {phone_number}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Service temporarily unavailable"
            )
    
    def _send_otp_sync(self, phone_number: str):
        """
        Синхронный вызов Twilio Verify API
        (запускается в отдельном потоке через asyncio.to_thread)
        """
        verification = self.client.verify.v2.services(
            self.verify_service_sid
        ).verifications.create(
            to=phone_number,
            channel='sms'  # Send via SMS (can be 'call' for voice)
        )
        return verification
