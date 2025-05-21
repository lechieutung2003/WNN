import json
import os
import sys

# Thêm thư mục cha vào đường dẫn để có thể import module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Thử import với cả đường dẫn tương đối và tuyệt đối
try:
    # Thử import từ package
    from semantic.PromptBuilder import PromptBuilder
except ImportError:
    try:
        # Thử import từ thư mục hiện tại
        from PromptBuilder import PromptBuilder
    except ImportError:
        print("Không thể import PromptBuilder. Vui lòng kiểm tra cấu trúc thư mục.")
        sys.exit(1)

def test_prompt_builder():
    # Sử dụng đường dẫn tuyệt đối để đảm bảo tìm thấy file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Thử nhiều vị trí có thể có của file Arts_List.json
    possible_paths = [
        os.path.join(os.path.dirname(current_dir), 'frontend', 'src', 'assets', 'data', 'Arts_List.json'),
        os.path.join(os.path.dirname(current_dir), 'frontend', 'public', 'data', 'Arts_List.json'),
        os.path.join(os.path.dirname(os.path.dirname(current_dir)), 'frontend', 'src', 'assets', 'data', 'Arts_List.json')
    ]
    
    arts_file_path = None
    for path in possible_paths:
        if os.path.exists(path):
            arts_file_path = path
            break
    
    if not arts_file_path:
        print("Không tìm thấy file Arts_List.json. Sử dụng dữ liệu mẫu thay thế.")
        # Dữ liệu mẫu để test nếu không tìm thấy file
        arts_list = [
            {
                "title": "Bust of a Man",
                "creator": "Donatello",
                "dateCreated": "1450s",
                "materials": "painted terracotta",
                "description": "This painted terracotta bust represents a man from the chest up. He wears a tunic with a simple, round neckline. His hair is short and curly, and his expression is serious and contemplative."
            },
            {
                "title": "The Holy Family with Saint John the Baptist",
                "creator": "El Greco (Domenikos Theotokopoulos)",
                "dateCreated": "1595",
                "materials": "Oil on canvas",
                "description": "A depiction of the Holy Family with Saint John the Baptist, characterized by El Greco's signature elongated figures and dramatic use of light and color."
            }
        ]
    else:
        try:
            # Đọc dữ liệu từ file
            with open(arts_file_path, "r", encoding="utf-8") as f:
                arts_list = json.load(f)
            print(f"Đã tải thành công dữ liệu từ {arts_file_path}")
        except Exception as e:
            print(f"Lỗi khi đọc file Arts_List.json: {str(e)}")
            return
    
    # Khởi tạo PromptBuilder
    builder = PromptBuilder()
    
    # Test với một số ví dụ
    print("\n===== KẾT QUẢ KIỂM TRA PROMPT =====\n")
    
    for i, artwork in enumerate(arts_list[:5]):  # Chỉ test 5 tác phẩm đầu tiên
        print(f"\n{'='*80}")
        print(f"TÁC PHẨM {i+1}: {artwork['title']} - {artwork['creator']}")
        print(f"{'='*80}")
        
        print(f"MÔ TẢ GỐC: {artwork['description'][:150]}...")
        print(f"VẬT LIỆU: {artwork.get('materials', 'Không có thông tin')}")
        print(f"THỜI GIAN: {artwork.get('dateCreated', 'Không có thông tin')}")
        
        # Tạo prompt
        try:
            result = builder.build_prompt(artwork)
            
            if result.get('success', False) == False:
                print(f"\nLỖI: {result.get('error', 'Không xác định')}")
                continue
                
            # Hiển thị prompt kết quả
            print(f"\n🎯 PROMPT ĐƯỢC TẠO RA:")
            print(f"  {result['prompt']}")
            
            # Hiển thị thông tin ngữ nghĩa
            print("\n📊 THÔNG TIN NGỮ NGHĨA ĐƯỢC TRÍCH XUẤT:")
            
            semantic_data = result.get('semantic_data', {})
            
            # In thông tin phong cách
            styles = semantic_data.get('style', [])
            if styles:
                print(f"  🖌️ Phong cách: {', '.join(styles[:2])}")
            
            # In thông tin về các yếu tố hình ảnh
            visual_elements = semantic_data.get('visual_elements', [])
            if visual_elements:
                print(f"  🖼️ Yếu tố hình ảnh: {', '.join(visual_elements[:3])}")
            
            # In thông tin về màu sắc
            colors = semantic_data.get('colors', [])
            if colors:
                print(f"  🎨 Màu sắc: {', '.join(colors)}")
            
            # In thông tin về thời kỳ
            period = semantic_data.get('period', {}).get('period', '')
            if period:
                print(f"  📅 Thời kỳ: {period}")
            
            # Hiển thị thông tin liên kết ngoài (nếu có)
            resources = result.get('additional_context', {}).get('resources', [])
            if resources:
                print("\n🔗 LIÊN KẾT BÊN NGOÀI:")
                for resource in resources:
                    print(f"  - {resource.get('label', 'Link')}: {resource.get('url', '')}")
            
        except Exception as e:
            print(f"\nLỖI KHI XỬ LÝ: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    print("===== KIỂM TRA PROMPTBUILDER =====")
    print("Script này sẽ kiểm tra khả năng tạo prompt cho AI từ dữ liệu ngữ nghĩa.\n")
    test_prompt_builder()
    print("\n===== HOÀN THÀNH =====")