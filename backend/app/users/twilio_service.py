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
        """Initialize Twilio client with API Key authentication (recommended for production)"""
        try:
            # Twilio recommends using API Keys for production
            # API Key = username, API Key Secret = password, Account SID = account_sid parameter
            if settings.TWILIO_API_SID and settings.TWILIO_API_SECRET:
                logger.info("🔑 Initializing Twilio with API Key authentication (Production)")
                logger.info(f"   API Key SID: {settings.TWILIO_API_SID[:8]}...")
                self.client = Client(
                    settings.TWILIO_API_SID,       # API Key SID (username)
                    settings.TWILIO_API_SECRET,     # API Key Secret (password)
                    settings.TWILIO_ACCOUNT_SID     # Account SID (passed as parameter)
                )
            else:
                # Fallback to Account SID/Auth Token for local testing
                logger.info("🔧 Initializing Twilio with Account SID/Auth Token (Testing)")
                logger.info(f"   Account SID: {settings.TWILIO_ACCOUNT_SID[:8]}...")
                self.client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            
            self.verify_service_sid = settings.TWILIO_VERIFY_SERVICE_SID
            logger.info(f"✅ Twilio client initialized successfully")
            logger.info(f"   Verify Service SID: {settings.TWILIO_VERIFY_SERVICE_SID[:8]}...")
            
            # Verify the account is accessible by fetching account info
            try:
                account = self.client.api.accounts(settings.TWILIO_ACCOUNT_SID).fetch()
                logger.info(f"✅ Twilio account verified: {account.friendly_name}")
                logger.info(f"Account status: {account.status}")
                logger.info(f"Account type: {account.type}")
            except Exception as e:
                logger.error(f"⚠️ Failed to verify Twilio account: {str(e)}")
                
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
                    detail="Неверный формат номера телефона."
                )
            elif e.code == 60203:  # Max send attempts reached
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Слишком много попыток отправки. Пожалуйста, попробуйте позже."
                )
            elif e.code == 20003:  # Authentication error
                logger.critical("Twilio authentication failed! Check credentials.")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Сервис временно недоступен. Попробуйте позже."
                )
            else:
                # General Twilio error (do not disclose details to client)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Не удалось отправить код. Попробуйте снова."
                )
        
        except Exception as e:
            # Handle unexpected errors (network issues, timeouts, etc.)
            logger.exception(f"Unexpected error sending OTP to {phone_number}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Сервис временно недоступен. Попробуйте позже."
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
            channel='sms',  # Send via SMS (can be 'call' for voice)
            locale='ru'     # Russian locale for SMS message
        )
        return verification

    async def verify_otp(self, phone_number: str, code: str) -> Dict[str, any]:
        """
        Verify OTP code for the specified phone number using Twilio Verify API.

        Args:
            phone_number: Phone number in E.164 format (e.g., +77771234567)
            code: The 6-digit OTP code entered by user

        Returns:
            Dict with verification result:
            {
                "success": True,
                "message": "Phone number verified successfully",
                "phone_number": "+77771234567"
            }

        Raises:
            HTTPException: При ошибках Twilio или неверном коде
        """

        try:
            logger.info(f"Attempting to verify OTP for {phone_number}")

            # Run in a separate thread to avoid blocking FastAPI's event loop
            verification_check = await asyncio.to_thread(
                self._verify_otp_sync,
                phone_number,
                code
            )

            if verification_check.status == 'approved':
                logger.info(f"OTP verified successfully for {phone_number}")
                return {
                    "success": True,
                    "message": "Номер телефона успешно подтвержден",
                    "phone_number": phone_number
                }
            else:
                logger.warning(f"OTP verification failed for {phone_number}. Status: {verification_check.status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Неверный или истекший код подтверждения."
                )

        except TwilioRestException as e:
            # Handle specific Twilio errors
            logger.error(f"Twilio error verifying OTP for {phone_number}: {e.code} - {e.msg}")

            # Different Twilio error codes
            if e.code == 60200:  # Invalid phone number
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Неверный формат номера телефона."
                )
            elif e.code == 60202:  # Max check attempts reached
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Слишком много попыток проверки. Пожалуйста, запросите новый код."
                )
            elif e.code == 60203:  # Max send attempts reached
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Слишком много попыток. Пожалуйста, попробуйте позже."
                )
            elif e.code == 20404:  # Verification not found or expired
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Код подтверждения истек. Пожалуйста, запросите новый код."
                )
            else:
                # General Twilio error (do not disclose details to client)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Неверный или истекший код подтверждения."
                )

        except HTTPException:
            # Re-raise HTTP exceptions as is
            raise

        except Exception as e:
            # Handle unexpected errors
            logger.exception(f"Unexpected error verifying OTP for {phone_number}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Сервис временно недоступен. Попробуйте позже."
            )

    def _verify_otp_sync(self, phone_number: str, code: str):
        """
        Синхронный вызов Twilio Verify API для проверки кода
        (запускается в отдельном потоке через asyncio.to_thread)
        """
        verification_check = self.client.verify.v2.services(
            self.verify_service_sid
        ).verification_checks.create(
            to=phone_number,
            code=code
        )
        return verification_check
