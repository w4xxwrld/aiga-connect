#!/usr/bin/env python3
"""
Simple script to run database seeding
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from seed_data import main

if __name__ == "__main__":
    print("Starting database seeding...")
    asyncio.run(main())
    print("Seeding completed!") 