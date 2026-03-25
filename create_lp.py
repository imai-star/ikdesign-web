import shutil
import os

src = r"C:\IKDesign\fudosan\app.py"
dst = r"C:\IKDesign\web\lp-ikdesign\index.html"

# Check what's in the web folder
print("既存ファイル確認:")
for f in os.listdir(r"C:\IKDesign\web\lp-ikdesign"):
    print(f)
```

実行：
```
python C:\IKDesign\web\create_lp.py
