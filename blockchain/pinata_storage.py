import requests
import os
import json
import traceback
from typing import Dict, Any

class PinataStorage:
    """Lớp xử lý lưu trữ qua Pinata IPFS"""
    
    def __init__(self, jwt=None, api_key=None, secret_key=None):
        self.jwt = jwt
        self.api_key = api_key
        self.secret_key = secret_key
        self.base_url = "https://api.pinata.cloud"
    
    def upload_artwork(self, image_path: str, metadata: Dict[str, str]) -> Dict[str, Any]:
        """Tải lên tác phẩm và tạo metadata cho NFT"""
        try:
            print(f"Uploading artwork from {image_path} to IPFS")
            
            # Kiểm tra file tồn tại
            if not os.path.exists(image_path):
                print(f"Image file not found at {image_path}")
                return {"success": False, "error": f"File not found: {image_path}"}
            
            # 1. Tải file ảnh lên IPFS
            image_cid = self._pin_file_to_ipfs(image_path, f"museum_artwork_{os.path.basename(image_path)}")
            if not image_cid:
                return {"success": False, "error": "Failed to upload image to IPFS"}
            
            print(f"Image uploaded successfully. CID: {image_cid}")
            
            # 2. Tạo metadata theo chuẩn ERC-721
            nft_metadata = {
                "name": metadata.get("title", "Untitled Artwork"),
                "description": metadata.get("description", ""),
                "image": f"ipfs://{image_cid}",
                "attributes": [
                    {
                        "trait_type": "Creator",
                        "value": metadata.get("creator", "Unknown")
                    },
                    {
                        "trait_type": "Date Created",
                        "value": metadata.get("dateCreated", "")
                    },
                    {
                        "trait_type": "Materials",
                        "value": metadata.get("materials", "")
                    }
                ]
            }
            
            # 3. Tạo file metadata JSON tạm thời
            temp_metadata_path = os.path.join(os.environ.get('TEMP', '.'), f"metadata_{os.path.basename(image_path)}.json")
            
            with open(temp_metadata_path, 'w') as f:
                json.dump(nft_metadata, f, indent=2)
            
            print(f"Created temporary metadata file at {temp_metadata_path}")
            
            # 4. Tải metadata lên IPFS
            metadata_cid = self._pin_file_to_ipfs(temp_metadata_path, f"metadata_{os.path.basename(image_path)}")
            
            # Xóa file tạm sau khi tải lên
            try:
                os.remove(temp_metadata_path)
            except Exception as e:
                print(f"Warning: Could not delete temp file: {str(e)}")
            
            if not metadata_cid:
                return {"success": False, "error": "Failed to upload metadata to IPFS"}
                
            print(f"Metadata uploaded successfully. CID: {metadata_cid}")
            
            return {
                "success": True,
                "image_cid": image_cid,
                "metadata_cid": metadata_cid,
                "metadata_url": f"ipfs://{metadata_cid}",
                "gateway_url": f"https://gateway.pinata.cloud/ipfs/{metadata_cid}"
            }
            
        except Exception as e:
            print(f"Error in upload_artwork: {str(e)}")
            print(traceback.format_exc())
            return {"success": False, "error": str(e)}
    
    def _pin_file_to_ipfs(self, file_path: str, name: str) -> str:
        """Tải một file lên IPFS qua Pinata và trả về CID"""
        try:
            print(f"Pinning file to IPFS: {file_path}")
            url = f"{self.base_url}/pinning/pinFileToIPFS"
            
            headers = {}
            if self.jwt:
                headers["Authorization"] = f"Bearer {self.jwt}"
            elif self.api_key and self.secret_key:
                headers["pinata_api_key"] = self.api_key
                headers["pinata_secret_api_key"] = self.secret_key
            else:
                raise ValueError("Cần cung cấp JWT hoặc API key/secret")
            
            payload = {
                'pinataMetadata': json.dumps({
                    'name': name
                }),
                'pinataOptions': json.dumps({
                    'cidVersion': 0
                })
            }
            
            files = {
                'file': (os.path.basename(file_path), open(file_path, 'rb'))
            }
            
            print(f"Sending request to Pinata API")
            response = requests.post(url, headers=headers, files=files, data=payload)
            
            if response.status_code >= 400:
                print(f"Error from Pinata API: {response.status_code} - {response.text}")
                return None
                
            result = response.json()
            print(f"Pinata upload successful: {result}")
            return result.get("IpfsHash")
            
        except Exception as e:
            print(f"Error while uploading to IPFS: {str(e)}")
            print(traceback.format_exc())
            return None