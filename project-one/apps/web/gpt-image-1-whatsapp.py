#!/usr/bin/env python3
"""
GPT-IMAGE-1 MODEL - PROFESSIONAL WHATSAPP IMAGES
Using the latest gpt-image-1 model for superior image generation
"""

import base64
import os
import time
import json
import requests
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# WhatsApp configuration
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
RECIPIENT = "919765071249"

print("🎨 GPT-IMAGE-1 PROFESSIONAL WHATSAPP IMAGE GENERATION")
print("=" * 63)
print("✅ Using gpt-image-1 model for superior quality")
print("✅ WhatsApp optimized: 1536x1024 (3:2 ratio)")
print("✅ High quality mode enabled")
print("✅ Professional financial infographics\n")

# Professional financial image prompts
image_prompts = [
    {
        "id": 1,
        "title": "SIP Calculator",
        "prompt": """Create a premium financial infographic for WhatsApp:
        
        MAIN TEXT (Ultra-clear, huge font):
        "₹61 LAKHS"
        
        SUBTITLE (Clear, large):
        "₹5,000 Monthly × 20 Years"
        
        BOTTOM TEXT (Medium):
        "12% Annual Returns"
        
        Style: Minimalist financial poster, navy blue gradient background, gold accent for amount, 
        lots of white space, professional banking aesthetic, no small text, crystal clear typography,
        editorial quality, WhatsApp optimized layout""",
        
        "caption": "💰 *Smart SIP Investment*\n\n₹5,000 monthly = ₹61 Lakhs in 20 years!\n\nStart your wealth journey today!"
    },
    {
        "id": 2,
        "title": "Tax Savings",
        "prompt": """Design a clean tax saving infographic for WhatsApp messaging:
        
        MAIN TEXT (Gigantic, bold):
        "SAVE ₹46,800"
        
        SUBTITLE (Large, clear):
        "Section 80C Benefits"
        
        BOTTOM (Simple icons):
        "ELSS • PPF • Insurance"
        
        Style: Green gradient background, white text, minimalist design, professional financial services 
        aesthetic, maximum readability, no clutter, editorial photography quality, perfect for mobile viewing""",
        
        "caption": "💸 *Tax Saving Guide*\n\nSave ₹46,800 under Section 80C!\n\nMaximize your tax benefits!"
    },
    {
        "id": 3,
        "title": "Portfolio Mix",
        "prompt": """Create a sophisticated portfolio allocation chart for WhatsApp:
        
        TITLE (Bold, clear):
        "PERFECT PORTFOLIO"
        
        MAIN VISUAL (Simple pie chart):
        "60% EQUITY" (blue)
        "30% DEBT" (green)
        "10% GOLD" (gold)
        
        Style: Clean white background, flat design, huge percentages, professional investment poster,
        minimalist aesthetic, perfect text clarity, mobile-first design, editorial quality""",
        
        "caption": "📊 *Portfolio Balance*\n\n60% Equity | 30% Debt | 10% Gold\n\nThe perfect wealth mix!"
    },
    {
        "id": 4,
        "title": "Emergency Fund",
        "prompt": """Design an emergency fund formula poster for WhatsApp:
        
        MAIN FORMULA (Huge, centered):
        "6 × ₹50,000 = ₹3 LAKHS"
        
        TOP TEXT (Medium):
        "Emergency Fund Formula"
        
        BOTTOM TEXT (Small):
        "Your Financial Safety Net"
        
        Style: Teal gradient background, white text with yellow accent for result, shield icon watermark,
        minimalist banking poster, crystal clear typography, professional financial services design""",
        
        "caption": "🛡️ *Emergency Fund*\n\n6 × Monthly Expenses = Safety Net\n\nProtect your future!"
    },
    {
        "id": 5,
        "title": "Retirement Goal",
        "prompt": """Create a retirement planning poster for WhatsApp messaging:
        
        MAIN NUMBER (Gigantic, gold):
        "₹5 CRORES"
        
        TOP TEXT (Medium):
        "Your Retirement Goal"
        
        BOTTOM TEXT (Small):
        "By Age 60 • Start at 30"
        
        Style: Purple gradient background, gold accent for amount, minimalist design, lots of empty space,
        professional wealth management aesthetic, perfect text rendering, editorial quality, mobile optimized""",
        
        "caption": "🎯 *Retirement Planning*\n\n₹5 Crore by 60!\n\nSecure your golden years!"
    }
]

def generate_image(prompt_config):
    """Generate image using gpt-image-1 model"""
    print(f"\n{prompt_config['id']}. Generating: {prompt_config['title']}")
    print("-" * 45)
    
    try:
        print("  🎨 Calling gpt-image-1 model...")
        
        # Generate image with gpt-image-1
        result = client.images.generate(
            model="gpt-image-1",
            prompt=prompt_config["prompt"],
            size="1536x1024",       # Best for WhatsApp (3:2 ratio)
            quality="high",         # Maximum quality
            background="auto",      # Automatic background
            n=1,                    # One variant
        )
        
        # Get base64 encoded image
        b64_json = result.data[0].b64_json
        image_bytes = base64.b64decode(b64_json)
        
        # Save locally
        fname = f"gpt_image_1_{prompt_config['id']}_{int(time.time())}.png"
        with open(fname, "wb") as f:
            f.write(image_bytes)
        
        print(f"  ✅ Generated successfully")
        print(f"  💾 Saved: {fname}")
        print(f"  📐 Size: 1536x1024 (WhatsApp optimized)")
        print(f"  🎯 Quality: HIGH")
        
        return {
            "success": True,
            "filename": fname,
            "caption": prompt_config["caption"],
            "title": prompt_config["title"],
            "image_bytes": image_bytes
        }
        
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return {"success": False, "error": str(e)}

def upload_to_imgur(image_bytes):
    """Upload image to Imgur for public URL"""
    print("  📤 Uploading to Imgur...")
    
    try:
        # Convert to base64 for Imgur API
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        response = requests.post(
            "https://api.imgur.com/3/image",
            headers={
                "Authorization": "Client-ID c97d599b1bc95e8"  # Public client ID
            },
            data={
                "image": b64_image,
                "type": "base64"
            }
        )
        
        data = response.json()
        
        if data.get("success"):
            url = data["data"]["link"]
            print(f"  ✅ Uploaded: {url}")
            return url
        else:
            print(f"  ❌ Upload failed: {data.get('data', {}).get('error', 'Unknown error')}")
            return None
            
    except Exception as e:
        print(f"  ❌ Upload error: {str(e)}")
        return None

def send_to_whatsapp(image_url, caption, title):
    """Send image to WhatsApp"""
    print(f"  📱 Sending to WhatsApp: {title}")
    
    url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    
    message = {
        "messaging_product": "whatsapp",
        "to": RECIPIENT,
        "type": "image",
        "image": {
            "link": image_url,
            "caption": caption
        }
    }
    
    try:
        response = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
                "Content-Type": "application/json"
            },
            json=message
        )
        
        data = response.json()
        
        if data.get("messages"):
            print(f"  ✅ Delivered to WhatsApp!")
            print(f"  📱 Message ID: {data['messages'][0]['id']}")
            return True
        else:
            error_msg = data.get("error", {}).get("message", "Unknown error")
            print(f"  ❌ Send failed: {error_msg}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False

def main():
    """Main execution"""
    print("\nStarting gpt-image-1 professional image generation...\n")
    
    results = []
    success_count = 0
    
    for prompt_config in image_prompts:
        # Generate image with gpt-image-1
        image_data = generate_image(prompt_config)
        
        if image_data["success"]:
            results.append(image_data)
            
            # Upload to Imgur for public URL
            public_url = upload_to_imgur(image_data["image_bytes"])
            
            if public_url:
                # Send to WhatsApp
                sent = send_to_whatsapp(public_url, image_data["caption"], image_data["title"])
                if sent:
                    success_count += 1
                    print(f"  🎉 {image_data['title']} complete!\n")
            
            # Clean up local file
            if os.path.exists(image_data["filename"]):
                os.remove(image_data["filename"])
            
            # Wait between requests
            time.sleep(2)
    
    print("=" * 63)
    print("✅ GPT-IMAGE-1 GENERATION COMPLETE")
    print("=" * 63)
    print()
    
    print("DELIVERY REPORT:")
    print("-" * 45)
    print(f"✅ Images Generated: {len(results)}/5")
    print(f"📱 Sent to WhatsApp: {success_count}/5")
    print(f"📞 Recipient: 9765071249")
    print()
    
    print("GPT-IMAGE-1 ADVANTAGES:")
    print("• Latest model with enhanced capabilities")
    print("• High quality mode for professional output")
    print("• Better text rendering than DALL-E 3")
    print("• WhatsApp optimized dimensions")
    print("• Professional financial design")
    print()
    
    if success_count == 5:
        print("🎉 SUCCESS! All 5 images delivered!")
        print("Check WhatsApp now for high-quality financial infographics!")
    elif success_count > 0:
        print(f"⚠️ Partial success: {success_count} images delivered")
    
    print("\nThis uses the gpt-image-1 model as requested!")
    print("Superior quality compared to standard models!\n")

if __name__ == "__main__":
    # Check if openai is installed
    try:
        import openai
    except ImportError:
        print("Installing openai package...")
        os.system("pip install openai python-dotenv requests")
    
    main()