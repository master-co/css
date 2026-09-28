# Language token and highlighting freeze QA approval

## Approved scope

Aron explicitly approved these 19 exact case differences in Codex task `01a0dbdd-0a03-7673-9933-a64a98fd1de5`, replying to request `call_M5C9Zebls1XKr1iCmuUg19je`, item 1. Recorded at `2026-09-27T17:33:53.038Z`.

The baseline is `bd164e4b5ae3a713940913d745183e9ab6b54263` and reviewed target `8fda9a42719f6700ad2a7339c8907ea58bb09d8d`. All target case digests were reverified at `4c0690aed92c5cd5021bea9b7fa3f6dcbdd8482e`. The pinned review JSON SHA-256 is `679ba03ede5a566d5b96cc836eb45536b20e34b805d23f190ed9d2001f8e4e58`; patch SHA-256 is `dd7ad3c50b2fe1d6cfdac2c8e6db3c34882b2ec9f36257a00e43634a211bea06`.

The exact review covers complete named-token enumMember classification, semantic utility styling, removal of component-only font weight/modifiers, directive/query spans including @, updated utility/pattern syntax, and native CSS grammar ownership. Native property highlighting coverage remains. Validation passed: Shiki 25/25, LSP semantic tokens 8/8, VSCode TextMate 11/11, historical/grammar Shiki 23/23, and focused tooling language tests 2/2; changed-package lint passed.

This approval covers only the digest pairs below and does not approve other migration differences, assert old/new byte equality, waive CI, authorize publication or close #445.

| Source ID | Target ID | Source digest | Target digest |
| --- | --- | --- | --- |
| `rc87-1cc1d0090085ed33` | `rc87-1cc1d0090085ed33` | `0298511f7df9b9e243ecb772980b25550acb1ed5a6acc2a6c2d41fc937a1d4bf` | `aae3dcbf38ee3943874e7deffa034379fadeb9d66153bb8aac1e40cefcb11839` |
| `rc87-dc7591a4ae298a44` | `rc87-dc7591a4ae298a44` | `6759722b51ad501fa7d1aa0dd30f81f5fd028162c9dab15d9eecd994fb3093e7` | `6d5dce779921cc5ae5b8b1799b53ba3181fa9eaf8b1291d0e85587c750bfce46` |
| `rc87-e39e3553acb8ff50` | `rc87-e39e3553acb8ff50` | `369e6e9202cb4433d85012aa8b90d378a0e35d1a2e456c47f3efa069e6184012` | `1a3a3f1554dbcae46a7a0c82b50b43c3f917d279623580d01da360e7863517e4` |
| `rc87-2c5a5b24e801cfff` | `rc87-2c5a5b24e801cfff` | `d3eaea3bbbcff8731825bf214123f891dc44e6e1f4c8d0decfa8bee3508a9849` | `3db1b85f0eaa0bb3ff8672b2d0494d954d944f3285b4057dae84a0aec9b35460` |
| `rc87-12186aa5abf43d09` | `rc87-12186aa5abf43d09` | `495258ab526e870f3f031ee20752c85bbd5e0262245774d14bfb8973e9cd0b6d` | `dc739deaba64ac325fa9c31dafaade59670639080252c627dd3b06e7dce25c9c` |
| `rc87-dd8bb950e0e1689f` | `rc87-dd8bb950e0e1689f` | `23618e63a338083833f901301ff8bb462a1bf048ba3610152fe992f6730f5ead` | `6df3d5ffaa6542cd8f7b0b22a3962ec356537714066e23d11c3e4a3a2a3c9908` |
| `rc87-048c5fec4032b5c6` | `rc87-048c5fec4032b5c6` | `7bd31e18c36c85efcfd5834854c1613fefe53f59d57997a6c031dd9f20ce05a3` | `6eee4673eb1dfbfbb5429575816cd15779ec61d6b1c8983148ca61e634f94a36` |
| `rc87-a5e7df0a818329f3` | `rc87-a5e7df0a818329f3` | `796b91a605afcaa326e393c89a33a741b8475db8b948486b385f11bae3ce325e` | `25b0bb634553e33d76c5336ecd4f0ef0080a3f9ad13a9fd1f0478e58dbf833d9` |
| `rc87-b1ef4609b9c3a1a7` | `rc87-b1ef4609b9c3a1a7` | `6f7bf9ee8de1c8d2091515661eeb1bada31990906a454f9617be114be4578a6e` | `dd24bb47ce5fb3e35759b42738fd5d1ee58b346a78f99b0eda3cdb9a360a690f` |
| `rc87-35f63a5af0e4a031` | `rc87-35f63a5af0e4a031` | `2d5d95474435bd62c4b77c3d26c455dbe72316b2d19a9a5061d47ef08120b16d` | `9272450eaa2d3290d9e5c4bca84e86a45eb432d47840eff16f1a549182e0a745` |
| `rc87-b65ebde91c14e95b` | `rc87-b65ebde91c14e95b` | `7f181eed07de7eebb5e8acec7db516a62373df2bdf61dc061bd41f90dd8a8fc8` | `70512485e9a74b393a4fa0a83816bd9fbcb256dff987d559503a507f8de5efcf` |
| `rc87-45de05367dfbdb24` | `rc87-45de05367dfbdb24` | `31518d64a8b7020b90db1956b106bcf004d3faaefcde762251e955e72234ec8e` | `0e416e0ba32a231a7c2603e56bc12915244436a08d3fbb5b50a25699ad654527` |
| `rc87-49294136507486df` | `rc87-49294136507486df` | `5252878a3d8ab8c74835d088e3204acdad15889c1a632e42c1690a47bbad121c` | `18e667b81f01c4f29798d1ca8d9a368227b8aba1fd8199e17109773cfa7885ba` |
| `rc87-69b24f0ff70fd33c` | `rc87-69b24f0ff70fd33c` | `95c367ee084d6559d985269d1fee310390d8507eca6ceaf3fbf2c6cdafe7f8fd` | `e7382ef0b147d626f9678ede371265705c81f2a46f1284ce66d167a97326799c` |
| `rc87-5b8cc29aa8a94cb9` | `rc87-5b8cc29aa8a94cb9` | `35aade9d2c0c386992964071759c5214c6ac350805b003b5a839c9f27634be2f` | `be22a37a9e3bbec979841b086aa4cac5593f82e7c6273e91043b91472fd5239a` |
| `rc87-a6cb1f63877dcff7` | `rc87-a6cb1f63877dcff7` | `4d6d31a2ec74ae42c8d3376ecba9355f8d129c4a29bb86ed876a13c4fb6aa662` | `192d095d345f8dd5b39ea053feb1eebfc9e0cd1c8df4f10892f187db3fe11c1d` |
| `rc87-5a3a055267fe6e03` | `rc87-5a3a055267fe6e03` | `6d766679256afc405847fd9c2fafbefc669cc3b5c10a54d0e8e51401cf4d3b49` | `a0caea6b591cc50c0f9b4c8d8e435f84ba1576875740522f1cd86ff363208f34` |
| `rc87-d6f1e639b422f215` | `rc87-d6f1e639b422f215` | `0254de95692502a2a4798f3f7f6b5c99289a91caff2c6390261a1553773cd462` | `12a0a3e4942a597e0bee57bea54d92cc0aa6a35dca0aa1b3531af8cdcc6e2fa4` |
| `rc87-c611fc1e092ab84c` | `rc87-c611fc1e092ab84c` | `d04e0d6e07fb4a3cf18927d9603b76f4019f5df295d10167f0c219861c7eeb99` | `cbc55fd84cd5ae2040e32e85713dbc394a983a2e97b36f1d2528278e441baa42` |
