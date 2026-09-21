# -*- coding: utf-8 -*-
"""mp4 박스 구조 점검 + (옵션) fragmented mp4의 길이 메타데이터 보정
   사용: py scripts/mp4_boxes.py <in.mp4> [fix <초>]
   MediaRecorder가 만든 fMP4는 mvhd/tkhd/mdhd duration이 첫 조각 길이로만 적혀 플레이어가 길이를 잘못 읽는다.
   fix는 크기를 바꾸지 않고 해당 필드 값만 덮어쓴다(오프셋 불변 → 안전)."""
import io, struct, sys
CONT = {b'moov', b'trak', b'mdia', b'minf', b'stbl', b'mvex', b'edts', b'moof', b'traf'}
def walk(f, start, end, depth, out, maxdepth=6):
    pos = start
    while pos + 8 <= end:
        f.seek(pos); hdr = f.read(8)
        if len(hdr) < 8: break
        size, typ = struct.unpack('>I4s', hdr); hs = 8
        if size == 1: size = struct.unpack('>Q', f.read(8))[0]; hs = 16
        elif size == 0: size = end - pos
        if size < hs: break
        out.append((depth, typ, pos, size, hs))
        if typ in CONT and depth < maxdepth: walk(f, pos + hs, pos + size, depth + 1, out, maxdepth)
        pos += size
path = sys.argv[1]
with io.open(path, 'r+b' if len(sys.argv) > 2 else 'rb') as f:
    f.seek(0, 2); total = f.tell(); out = []; walk(f, 0, total, 0, out)
    top = [o for o in out if o[0] == 0]; cnt = {}
    for o in top: cnt[o[1]] = cnt.get(o[1], 0) + 1
    print('size', total, 'top-level', {k.decode(): v for k, v in cnt.items()})
    mv_ts = None
    for d, typ, pos, size, hs in out:
        if typ in (b'mvhd', b'tkhd', b'mdhd', b'mehd', b'elst'):
            f.seek(pos + hs); ver = f.read(1)[0]; f.read(3)
            if typ == b'mvhd' or typ == b'mdhd':
                if ver == 1: f.read(16); ts = struct.unpack('>I', f.read(4))[0]; dpos = f.tell(); dur = struct.unpack('>Q', f.read(8))[0]; w = 8
                else: f.read(8); ts = struct.unpack('>I', f.read(4))[0]; dpos = f.tell(); dur = struct.unpack('>I', f.read(4))[0]; w = 4
                if typ == b'mvhd': mv_ts = ts
                print('  ' * d + typ.decode(), 'v%d timescale=%d duration=%d (%.2fs)' % (ver, ts, dur, dur / ts if ts else 0))
                if len(sys.argv) > 3 and sys.argv[2] == 'fix':
                    nd = int(float(sys.argv[3]) * ts); f.seek(dpos); f.write(struct.pack('>Q' if w == 8 else '>I', nd)); print('  ' * d + '  -> fixed', nd)
            elif typ == b'tkhd':
                if ver == 1: f.read(16); f.read(4); f.read(4); dpos = f.tell(); dur = struct.unpack('>Q', f.read(8))[0]; w = 8
                else: f.read(8); f.read(4); f.read(4); dpos = f.tell(); dur = struct.unpack('>I', f.read(4))[0]; w = 4
                print('  ' * d + 'tkhd v%d duration=%d (mvhd ts)' % (ver, dur))
                if len(sys.argv) > 3 and sys.argv[2] == 'fix' and mv_ts:
                    nd = int(float(sys.argv[3]) * mv_ts); f.seek(dpos); f.write(struct.pack('>Q' if w == 8 else '>I', nd)); print('  ' * d + '  -> fixed', nd)
            elif typ == b'mehd':
                dur = struct.unpack('>Q' if ver == 1 else '>I', f.read(8 if ver == 1 else 4))[0]; print('  ' * d + 'mehd fragment_duration=%d' % dur)
            else: print('  ' * d + 'elst present')
    names = [o[1].decode('latin1') for o in out if o[0] <= 2 and o[1] not in (b'moof', b'mdat')]
    print('boxes(depth<=2, no moof/mdat):', ' '.join(names[:40]))
