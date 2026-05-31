import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, Hash } from 'lucide-react';

// Pure JS MD5 (same as Md5Hash component)
function md5(input: string): string {
    function safeAdd(x: number, y: number) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
    function bitRotateLeft(num: number, cnt: number) { return (num << cnt) | (num >>> (32 - cnt)); }
    function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
    function binlMD5(x: number[], len: number) {
        x[len >> 5] |= 0x80 << (len % 32); x[((len + 64) >>> 9 << 4) + 14] = len;
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (let i = 0; i < x.length; i += 16) {
            const oa=a,ob=b,oc=c,od=d;
            a=md5ff(a,b,c,d,x[i],7,-680876936);d=md5ff(d,a,b,c,x[i+1],12,-389564586);c=md5ff(c,d,a,b,x[i+2],17,606105819);b=md5ff(b,c,d,a,x[i+3],22,-1044525330);
            a=md5ff(a,b,c,d,x[i+4],7,-176418897);d=md5ff(d,a,b,c,x[i+5],12,1200080426);c=md5ff(c,d,a,b,x[i+6],17,-1473231341);b=md5ff(b,c,d,a,x[i+7],22,-45705983);
            a=md5ff(a,b,c,d,x[i+8],7,1770035416);d=md5ff(d,a,b,c,x[i+9],12,-1958414417);c=md5ff(c,d,a,b,x[i+10],17,-42063);b=md5ff(b,c,d,a,x[i+11],22,-1990404162);
            a=md5ff(a,b,c,d,x[i+12],7,1804603682);d=md5ff(d,a,b,c,x[i+13],12,-40341101);c=md5ff(c,d,a,b,x[i+14],17,-1502002290);b=md5ff(b,c,d,a,x[i+15],22,1236535329);
            a=md5gg(a,b,c,d,x[i+1],5,-165796510);d=md5gg(d,a,b,c,x[i+6],9,-1069501632);c=md5gg(c,d,a,b,x[i+11],14,643717713);b=md5gg(b,c,d,a,x[i],20,-373897302);
            a=md5gg(a,b,c,d,x[i+5],5,-701558691);d=md5gg(d,a,b,c,x[i+10],9,38016083);c=md5gg(c,d,a,b,x[i+15],14,-660478335);b=md5gg(b,c,d,a,x[i+4],20,-405537848);
            a=md5gg(a,b,c,d,x[i+9],5,568446438);d=md5gg(d,a,b,c,x[i+14],9,-1019803690);c=md5gg(c,d,a,b,x[i+3],14,-187363961);b=md5gg(b,c,d,a,x[i+8],20,1163531501);
            a=md5gg(a,b,c,d,x[i+13],5,-1444681467);d=md5gg(d,a,b,c,x[i+2],9,-51403784);c=md5gg(c,d,a,b,x[i+7],14,1735328473);b=md5gg(b,c,d,a,x[i+12],20,-1926607734);
            a=md5hh(a,b,c,d,x[i+5],4,-378558);d=md5hh(d,a,b,c,x[i+8],11,-2022574463);c=md5hh(c,d,a,b,x[i+11],16,1839030562);b=md5hh(b,c,d,a,x[i+14],23,-35309556);
            a=md5hh(a,b,c,d,x[i+1],4,-1530992060);d=md5hh(d,a,b,c,x[i+4],11,1272893353);c=md5hh(c,d,a,b,x[i+7],16,-155497632);b=md5hh(b,c,d,a,x[i+10],23,-1094730640);
            a=md5hh(a,b,c,d,x[i+13],4,681279174);d=md5hh(d,a,b,c,x[i],11,-358537222);c=md5hh(c,d,a,b,x[i+3],16,-722521979);b=md5hh(b,c,d,a,x[i+6],23,76029189);
            a=md5hh(a,b,c,d,x[i+9],4,-640364487);d=md5hh(d,a,b,c,x[i+12],11,-421815835);c=md5hh(c,d,a,b,x[i+15],16,530742520);b=md5hh(b,c,d,a,x[i+2],23,-995338651);
            a=md5ii(a,b,c,d,x[i],6,-198630844);d=md5ii(d,a,b,c,x[i+7],10,1126891415);c=md5ii(c,d,a,b,x[i+14],15,-1416354905);b=md5ii(b,c,d,a,x[i+5],21,-57434055);
            a=md5ii(a,b,c,d,x[i+12],6,1700485571);d=md5ii(d,a,b,c,x[i+3],10,-1894986606);c=md5ii(c,d,a,b,x[i+10],15,-1051523);b=md5ii(b,c,d,a,x[i+1],21,-2054922799);
            a=md5ii(a,b,c,d,x[i+8],6,1873313359);d=md5ii(d,a,b,c,x[i+15],10,-30611744);c=md5ii(c,d,a,b,x[i+6],15,-1560198380);b=md5ii(b,c,d,a,x[i+3],21,1309151649);
            a=md5ii(a,b,c,d,x[i+12],6,-145523070);d=md5ii(d,a,b,c,x[i+1],10,-1120210379);c=md5ii(c,d,a,b,x[i+8],15,718787259);b=md5ii(b,c,d,a,x[i+15],21,-343485551);
            a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
        }
        return [a,b,c,d];
    }
    function str2binl(str: string) { const bin: number[] = []; for (let i = 0; i < str.length * 8; i += 8) bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << (i % 32); return bin; }
    function binl2hex(b: number[]) { const h='0123456789abcdef'; let s=''; for(let i=0;i<b.length*4;i++) s+=h.charAt((b[i>>2]>>((i%4)*8+4))&0xf)+h.charAt((b[i>>2]>>((i%4)*8))&0xf); return s; }
    const utf8 = unescape(encodeURIComponent(input));
    return binl2hex(binlMD5(str2binl(utf8), utf8.length * 8));
}

// Web Crypto SHA hashing
async function shaHash(text: string, algo: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

type Algo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';
const ALGOS: { id: Algo; bits: number; color: string }[] = [
    { id: 'MD5', bits: 128, color: 'text-red-400' },
    { id: 'SHA-1', bits: 160, color: 'text-yellow-400' },
    { id: 'SHA-256', bits: 256, color: 'text-blue-400' },
    { id: 'SHA-512', bits: 512, color: 'text-purple-400' },
];

const TextToHash: React.FC = () => {
    const [input, setInput] = useState('');
    const [hashes, setHashes] = useState<Record<Algo, string>>({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' });
    const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);

    const generateAll = useCallback(async (text: string) => {
        setInput(text);
        if (!text) {
            setHashes({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' });
            return;
        }
        let sha1 = 'Requires HTTPS/localhost', sha256 = 'Requires HTTPS/localhost', sha512 = 'Requires HTTPS/localhost';
        
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            try {
                [sha1, sha256, sha512] = await Promise.all([
                    shaHash(text, 'SHA-1'),
                    shaHash(text, 'SHA-256'),
                    shaHash(text, 'SHA-512'),
                ]);
            } catch (e) {
                sha1 = sha256 = sha512 = 'Error generating hash';
            }
        }

        setHashes({
            'MD5': md5(text),
            'SHA-1': sha1,
            'SHA-256': sha256,
            'SHA-512': sha512,
        });
    }, []);

    const handleCopy = (algo: Algo) => {
        navigator.clipboard.writeText(hashes[algo]);
        setCopiedAlgo(algo);
        setTimeout(() => setCopiedAlgo(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-semibold text-gray-300 tracking-wide uppercase">Multi-Hash Generator</span>
                    </div>
                    <button onClick={() => { setInput(''); setHashes({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 block">Input Text</label>
                        <textarea value={input} onChange={(e) => generateAll(e.target.value)}
                            placeholder="Type text to generate all hashes simultaneously..."
                            className="w-full h-32 p-3 bg-black/20 border border-white/10 rounded-xl font-mono text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500/50 focus:border-transparent resize-none transition-all" />
                    </div>

                    {input && (
                        <div className="space-y-3">
                            {ALGOS.map(({ id, bits, color }) => (
                                <div key={id} className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-bold ${color}`}>{id}</span>
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{bits} bits</span>
                                            <span className="text-[10px] text-gray-500">{hashes[id].length} chars</span>
                                        </div>
                                        <button onClick={() => handleCopy(id)}
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                                            {copiedAlgo === id ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                        </button>
                                    </div>
                                    <div className="font-mono text-xs text-gray-300 break-all leading-relaxed select-all bg-black/20 p-2.5 rounded-lg">
                                        {hashes[id] || '...'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TextToHash;
