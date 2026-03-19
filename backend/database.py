import motor.motor_asyncio
import os

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "dashbuilder"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client[DATABASE_NAME]

def get_database():
    return db

# Collections
users_collection = db["users"]
dashboard_config_collection = db["dashboard_config"]
customer_orders_collection = db["customer_orders"]
