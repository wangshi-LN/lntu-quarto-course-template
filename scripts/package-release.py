"""Package committed source plus rendered decks using only Python's standard library."""
import argparse
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile


ROOT = Path(__file__).resolve().parent.parent


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', required=True)
    parser.add_argument('--date', required=True, help='Creation date in Asia/Shanghai, YYYY-MM-DD')
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'\d+\.\d+\.\d+', args.version):
        raise SystemExit('Use a numeric major.minor.patch version.')
    date.fromisoformat(args.date)
    destination = args.output_dir.resolve(strict=True)
    if not destination.is_dir():
        raise SystemExit('Output directory must already exist.')
    archive = destination / f'lntu-quarto-course-template-v{args.version}.zip'
    checksum = archive.with_suffix('.zip.sha256')
    if archive.exists() or checksum.exists():
        raise SystemExit('Release output already exists; refusing to overwrite it.')

    # Existing unrelated .gitignore edits stay local; package its committed version.
    changed = set(git('diff', '--name-only', 'HEAD', '-z').decode().strip('\0').split('\0'))
    changed -= {'', '.gitignore'}
    if changed:
        raise SystemExit('Commit source changes before packaging: ' + ', '.join(sorted(changed)))
    commit = git('rev-parse', 'HEAD').decode().strip()
    payload = {}
    for row in git('ls-tree', '-r', '-z', '--full-tree', 'HEAD').split(b'\0'):
        if not row:
            continue
        info, name = row.split(b'\t', 1)
        mode, kind, oid = info.decode().split()
        if kind != 'blob' or mode not in ('100644', '100755'):
            raise SystemExit('Unsupported source entry: ' + name.decode())
        payload[name.decode('utf-8')] = git('cat-file', 'blob', oid)

    for filename in ('course.html', 'layouts.html'):
        payload[filename] = (ROOT / filename).read_bytes()
    # assets/ is already included from Git; do not sweep untracked local files.
    for dirname in ('course_files', 'layouts_files'):
        folder = ROOT / dirname
        if not folder.is_dir():
            raise SystemExit('Missing distribution directory: ' + dirname)
        for item in sorted(folder.rglob('*')):
            if item.is_symlink():
                raise SystemExit('Refusing symlink: ' + str(item))
            if item.is_file():
                name = item.relative_to(ROOT).as_posix()
                data = item.read_bytes()
                if name in payload and data != payload[name]:
                    raise SystemExit('Source differs from committed content: ' + name)
                payload[name] = data

    instructions = '''辽宁工程技术大学课程模板：下载后直接播放

1. 请先把整个 ZIP 解压到普通文件夹。
2. 双击“打开课件.cmd”或 course.html，直接打开模板课件。
3. 双击“查看版式.cmd”或 layouts.html，查看全部版式示例。

播放无需安装 Quarto、Python、R 或 Jupyter，也无需先生成 HTML。
请保留 course_files、layouts_files、assets 文件夹，不要单独移动 HTML。
网络视频需要联网。按 S 打开演讲者窗口，C 开关页面批注，B 开关黑板。
本包为模板示例，不含三讲学术写作课程内容。
编辑 QMD 后重新生成才需要 Quarto，具体操作见 README.md。
源码与文档采用 MIT（Wang Shi）；素材范围见 THIRD_PARTY_NOTICES.md。
'''
    payload['开始使用.txt'] = instructions.encode('utf-8-sig')
    manifest = {
        'version': args.version, 'date_beijing': args.date, 'source_commit': commit,
        'quarto_version': subprocess.check_output(['quarto', '--version'], shell=True).decode().strip(),
        'files': {name: {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
                  for name, data in sorted(payload.items())}
    }
    payload['PACKAGE-MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
    prefix = f'课件包-辽宁工大模板-{args.date}/'
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as output:
        for name, data in sorted(payload.items()):
            output.writestr(prefix + name, data)
    with zipfile.ZipFile(archive) as packed:
        if packed.testzip() is not None:
            raise SystemExit('ZIP CRC verification failed.')
        if set(packed.namelist()) != {prefix + name for name in payload}:
            raise SystemExit('ZIP file list verification failed.')
        for name, original in payload.items():
            if hashlib.sha256(packed.read(prefix + name)).digest() != hashlib.sha256(original).digest():
                raise SystemExit('ZIP content mismatch: ' + name)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    with checksum.open('x', encoding='ascii') as output:
        output.write(f'{digest}  {archive.name}\n')
    print(json.dumps({'archive': str(archive), 'bytes': archive.stat().st_size,
                      'files': len(payload), 'sha256': digest, 'source_commit': commit,
                      'crc_and_file_hashes_verified': True}, ensure_ascii=False))


if __name__ == '__main__':
    main()
