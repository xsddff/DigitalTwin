#!/usr/bin/env python3
"""
诊断脚本：检查可能导致 'argument of type NoneType is not iterable' 错误的常见问题
"""
import sys
import os

# 添加source路径
sys.path.insert(0, '/source')

print("=" * 60)
print("Python NoneType 错误诊断工具")
print("=" * 60)

# 1. 检查环境变量
print("\n[1] 检查关键环境变量...")
critical_vars = [
    'WORKSPACE_PATH',
    'LOG_LEVEL',
    'PORT',
    'COZE_WORKSPACE_PATH',
    'USER_SERVER_WORKSPACE_PATH',
]

missing_vars = []
for var in critical_vars:
    value = os.environ.get(var)
    if value:
        print(f"  ✓ {var}: {value}")
    else:
        print(f"  ✗ {var}: 未设置")
        missing_vars.append(var)

if missing_vars:
    print(f"\n  ⚠ 警告：{len(missing_vars)} 个环境变量未设置")
else:
    print("\n  ✓ 所有关键环境变量已设置")

# 2. 检查关键目录
print("\n[2] 检查关键目录...")
critical_dirs = [
    '/workspace/projects',
    '/workspace/projects/front',
    '/app/work/logs/bypass',
]

for dir_path in critical_dirs:
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        print(f"  ✓ {dir_path}: 存在")
        # 检查可读写权限
        if os.access(dir_path, os.R_OK | os.W_OK):
            print(f"    ✓ 可读写")
        else:
            print(f"    ⚠ 权限受限")
    else:
        print(f"  ✗ {dir_path}: 不存在或不是目录")

# 3. 尝试导入app模块
print("\n[3] 尝试导入 app.main 模块...")
try:
    import app.main
    print("  ✓ app.main 导入成功")
    
    # 检查关键属性
    attrs_to_check = [
        'WORKSPACE_PATH',
        'LOG_DIR',
        'PORT',
        'WORKSPACE_PATH',
    ]
    
    print("\n  检查关键属性:")
    for attr in attrs_to_check:
        if hasattr(app.main, attr):
            value = getattr(app.main, attr)
            if value is None:
                print(f"    ⚠ {attr}: None")
            else:
                print(f"    ✓ {attr}: {value}")
        else:
            print(f"    ✗ {attr}: 不存在")
            
except ImportError as e:
    print(f"  ✗ 导入失败: {e}")
except Exception as e:
    print(f"  ✗ 错误: {type(e).__name__}: {e}")

# 4. 检查配置文件
print("\n[4] 检查配置文件...")
config_files = [
    '/source/access_token.pem',
]

for file_path in config_files:
    if os.path.exists(file_path):
        print(f"  ✓ {file_path}: 存在")
    else:
        print(f"  ✗ {file_path}: 不存在")

# 5. 模拟可能的操作
print("\n[5] 模拟常见的可能失败的操作...")

# 模拟列表操作
test_data = [1, 2, 3]
try:
    result = [x for x in test_data if x > 0]
    print(f"  ✓ 列表推导式: 正常")
except TypeError as e:
    print(f"  ✗ 列表推导式: {e}")

# 模拟None值的迭代
test_none = None
try:
    result = [x for x in test_none if x]
    print(f"  ✓ None值迭代: 未触发错误（意外）")
except TypeError as e:
    print(f"  ✓ None值迭代: 捕获到预期错误 - {e}")

# 模拟 in 操作
try:
    result = "test" in None
    print(f"  ✓ None值in操作: 未触发错误（意外）")
except TypeError as e:
    print(f"  ✓ None值in操作: 捕获到预期错误 - {e}")

print("\n" + "=" * 60)
print("诊断完成")
print("=" * 60)
