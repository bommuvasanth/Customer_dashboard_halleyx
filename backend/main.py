from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import json
import os
import bcrypt
from jose import JWTError, jwt
from bson import ObjectId
from database import users_collection, dashboard_config_collection, customer_orders_collection

# Security Configuration
SECRET_KEY = "halleyx_ultra_secure_secret_intelligence_hub_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# Helper for password hashing
def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

app = FastAPI()

# CORS configuration - allow frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://customer-dashboard-halleyx.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = None

class DashboardSaveRequest(BaseModel):
    widgets: List[dict]

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(lambda x: None)): # Placeholder for real dependency
    # In a real app, you'd extract token from header and verify
    # For now, we'll keep it simple as the frontend handles route protection
    pass

@app.on_event("startup")
async def startup_db_client():
    # Seed admin user if not exists
    admin = await users_collection.find_one({"email": "admin1804@gmail.com"})
    if not admin:
        await users_collection.insert_one({
            "name": "Admin User",
            "email": "admin1804@gmail.com",
            "password": get_password_hash("admin254"),
            "role": "admin"
        })
    # Seed customer user if not exists
    customer = await users_collection.find_one({"email": "customer@halleyx.com"})
    if not customer:
        await users_collection.insert_one({
            "name": "Customer User",
            "email": "customer@halleyx.com",
            "password": get_password_hash("customer123"),
            "role": "customer"
        })
    # Seed orders if empty
    count = await customer_orders_collection.count_documents({})
    if count == 0:
        sample_orders = [
            {
                "firstName": "John", "lastName": "Doe", "email": "john@example.com", "phone": "1234567890",
                "streetAddress": "123 Maple St", "city": "New York", "state": "NY", "postalCode": "10001", "country": "USA",
                "product": "Cyber Engine", "quantity": 2, "unitPrice": 1500.0, "totalAmount": 3000.0,
                "status": "Completed", "createdBy": "System", "orderDate": datetime.utcnow().isoformat() + "Z"
            },
            {
                "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "phone": "0987654321",
                "streetAddress": "456 Oak Ave", "city": "London", "state": "LDN", "postalCode": "SW1", "country": "UK",
                "product": "Data Core", "quantity": 1, "unitPrice": 2400.0, "totalAmount": 2400.0,
                "status": "Pending", "createdBy": "System", "orderDate": (datetime.utcnow() - timedelta(days=1)).isoformat() + "Z"
            }
        ]
        await customer_orders_collection.insert_many(sample_orders)

@app.post("/api/auth/login")
async def auth_login(request: LoginRequest):
    user = await users_collection.find_one({"email": request.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
        
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "role": user["role"],
            "name": user["name"]
        }
    }

@app.get("/api/orders")
async def get_orders(dateFilter: str = "All time"):
    cursor = customer_orders_collection.find({}).sort("orderDate", -1)
    orders = await cursor.to_list(length=1000)
    
    # Simple ID conversion for frontend
    for o in orders:
        o["id"] = str(o["_id"])
        del o["_id"]
        
    if dateFilter == "All time":
        return orders
        
    now = datetime.utcnow()
    
    if dateFilter == "Today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif dateFilter == "Last 7 Days":
        cutoff = now - timedelta(days=7)
    elif dateFilter == "Last 30 Days":
        cutoff = now - timedelta(days=30)
    elif dateFilter == "Last 90 Days":
        cutoff = now - timedelta(days=90)
    else:
        return orders

    filtered = [o for o in orders if datetime.fromisoformat(o["orderDate"].replace("Z", "")) >= cutoff]
    return filtered

class OrderCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    streetAddress: str
    city: str
    state: str
    postalCode: str
    country: str
    product: str
    quantity: Optional[int] = 1
    unitPrice: Optional[float] = 0.0
    status: Optional[str] = "Pending"
    createdBy: Optional[str] = "System"

@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
async def create_order(order: OrderCreate):
    qty = max(1, order.quantity if order.quantity else 1)
    price = order.unitPrice if order.unitPrice else 0.0
    
    new_order = {
        "firstName": order.firstName,
        "lastName": order.lastName,
        "email": order.email,
        "phone": order.phone,
        "streetAddress": order.streetAddress,
        "city": order.city,
        "state": order.state,
        "postalCode": order.postalCode,
        "country": order.country,
        "product": order.product,
        "quantity": qty,
        "unitPrice": price,
        "totalAmount": qty * price,
        "status": order.status or "Pending",
        "createdBy": order.createdBy or "System",
        "orderDate": datetime.utcnow().isoformat() + "Z"
    }
    
    result = await customer_orders_collection.insert_one(new_order)
    new_order["id"] = str(result.inserted_id)
    del new_order["_id"]
    return new_order

@app.put("/api/orders/{order_id}")
async def update_order(order_id: str, order: OrderCreate):
    try:
        try:
            target_id = ObjectId(order_id)
        except:
            target_id = order_id

        qty = max(1, order.quantity if order.quantity else 1)
        price = order.unitPrice if order.unitPrice else 0.0
        
        updated_order = {
            "firstName": order.firstName,
            "lastName": order.lastName,
            "email": order.email,
            "phone": order.phone,
            "streetAddress": order.streetAddress,
            "city": order.city,
            "state": order.state,
            "postalCode": order.postalCode,
            "country": order.country,
            "product": order.product,
            "quantity": qty,
            "unitPrice": price,
            "totalAmount": qty * price,
            "status": order.status or "Pending",
            "createdBy": order.createdBy or "System"
        }
        
        result = await customer_orders_collection.update_one(
            {"_id": target_id},
            {"$set": updated_order}
        )
        
        if result.matched_count == 1:
            return {"status": "success", "message": "Order updated successfully"}
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        print(f"Update error: {e}")
        raise HTTPException(status_code=400, detail="Invalid order ID or data format")

@app.delete("/api/orders/{order_id}")
async def delete_order(order_id: str):
    try:
        try:
            target_id = ObjectId(order_id)
        except:
            target_id = order_id
            
        result = await customer_orders_collection.delete_one({"_id": target_id})
        if result.deleted_count == 1:
            return {"status": "success", "message": "Order deleted successfully"}
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        print(f"Delete error: {e}")
        raise HTTPException(status_code=400, detail="Invalid order ID")

@app.get("/api/dashboard/widgets")
async def get_dashboard_widgets():
    # In a real app, filter by user email/id from token
    # For now, get the latest config
    config = await dashboard_config_collection.find_one({}, sort=[("updated_at", -1)])
    if not config:
        return {"widgets": []}
    
    config["id"] = str(config["_id"])
    del config["_id"]
    return config

@app.post("/api/dashboard/save")
async def save_dashboard_widgets(request: DashboardSaveRequest):
    new_config = {
        "user_id": "admin_test", # Mock user id
        "widgets": request.widgets,
        "updated_at": datetime.utcnow()
    }
    
    # Upsert logic - if exists update, else insert
    # For simplicity, we just insert a new one or update the same one if user_id is fixed
    await dashboard_config_collection.update_one(
        {"user_id": "admin_test"},
        {"$set": new_config},
        upsert=True
    )
    
    return {"status": "success", "message": "Configuration saved"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
