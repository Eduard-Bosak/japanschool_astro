#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix encoding: read file with wrong encoding, write as UTF-8 without BOM
"""

import sys
import codecs

def fix_encoding(input_file, output_file):
    """
    Try to read with various encodings and write as UTF-8 without BOM
    """
    encodings = ['utf-8', 'cp1251', 'cp866', 'windows-1251']

    content = None
    used_encoding = None

    for enc in encodings:
        try:
            with codecs.open(input_file, 'r', encoding=enc) as f:
                content = f.read()
                used_encoding = enc
                print(f"✅ Successfully read with encoding: {enc}")
                break
        except (UnicodeDecodeError, UnicodeError):
            continue

    if content is None:
        print("❌ Failed to read file with any encoding!")
        sys.exit(1)

    # Write as UTF-8 without BOM
    with codecs.open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Written as UTF-8 without BOM: {output_file}")
    print(f"   Original encoding: {used_encoding}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python fix-utf8.py <input.html> [output.html]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path

    fix_encoding(input_path, output_path)
