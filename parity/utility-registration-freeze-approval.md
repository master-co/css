# Utility registration freeze QA approval

## Approved scope

Aron explicitly approved these 24 exact case differences in Codex task `01a0dbdd-0a03-7673-9933-a64a98fd1de5`, replying to request `call_rgLQIvSFVdVkmYSiA18n2zqE`, item 0. Recorded at `2026-09-27T16:51:16.953Z`. This approval applies only to the digest pairs below.

The reviewed baseline is `bd164e4b5ae3a713940913d745183e9ab6b54263`; the reviewed package target is `f9a1d2b606ce19cc691bd5124eb200e3cf45171b`. All target case digests were rechecked at `a3b78f7b4fa982e2972a628b45c52cc207efc544` before recording. The complete review JSON SHA-256 is `b59d8c27d34ffd0be999e15db363e49cf55ee19c44f2d2934c196de7ef665952`; its before/after patch SHA-256 is `92107d16a868acbe25f4b4a770c5136e89b9d229c03ac47521e91b32a421c689`.

The approved cases replace the removed on-demand `@components` registration with `@utilities`, together with corresponding Manifest utility-layer metadata and layer assertions. Generated utilities occupy the utilities cascade layer; this is an intentional contract change rather than a claim of identical old/new CSS bytes. Other assertions within these case bodies remain unchanged.

Native `@layer components` remains valid. Four unrelated native-layer fixture renames were excluded from this review and restored separately. This approval does not cover other migration differences, waive CI, rewrite frozen expectations, or close #445.

| Case ID | Package | Baseline source digest | Approved target digest |
| --- | --- | --- | --- |
| `rc87-37e35a8768a9d50b` | compiler | `b856ce7fdd73b5f39ddb92f09169bc91e2ac375f51f699aff0c05a959b908cc3` | `7c7a297ff8f4969bfa755fba39e9a46adf4ed75249aa62fa83725f6a6ba2dc99` |
| `rc87-5e7f87aa19abfb63` | compiler | `cfc51000cd41a77b504897cea1b4e583af3fedcde22d670440a1e3652e1c90ed` | `84e991d660d9bb2741cb4ba25a9d45ad8a3662923934fbd58782869b377f2e50` |
| `rc87-7393f7c77328795c` | compiler | `f98e7fc63c9517ee9fc45f8372916f10b6e3cc2b8b14ae503b9784ae3f24644d` | `5e67a191b8dfe742049e79e98865435d3b297a75092670336421dd74a550a4a0` |
| `rc87-e7f1f864cac62727` | compiler | `60d85a0209d7a42fb50746a31733aca8750b1a11fc82e4ff255f65d7344d010c` | `fc0350a3426a80b4b37e44302ecd44f0913efd70624b65a2d13ba519dc7b1ca2` |
| `rc87-df2379cc46e6cb8f` | compiler | `e61d16ee5554b9010aaa1b383be755ec781d84e00a9524ab39aaa24ea049992b` | `12278a7cb31eeb13d7e56988040b91282acc8977b22444c477286dfa144b0798` |
| `rc87-06eb46320f280e80` | compiler | `584ba19cec07112a7220a24f39664ee39c426ae8d3df81485da80dd22bdbdb9f` | `a2c2a8cded517a1ecd88368b8e34a2659027bc402b3f835b8c1656a1d7880b7e` |
| `rc87-6ef0dd365e7230a1` | compiler | `a68e534c3a51da9e6e60833aa1dccdea9884b940b6415808d079ffc63aac2c93` | `4b91945b457d6cf08bd59f9aea7f22e2eab82459529de2e56ee02d9422bd3a1b` |
| `rc87-32df64bdd39d50d5` | compiler | `96c84fb146aa8d3e1e7dce37dad9cc357820a1c4c33764ebe58c3549fc43ecfb` | `5b803743d962edd51b280c9ab81fe140c4bd79980340c6f53f52905dc42ea94e` |
| `rc87-18d63467f01b574f` | compiler | `7f5bc7996e61b89d7cf70d03acf7ff5f752059513b1b0fc2abcbc5384f0f2a3e` | `72fb1d3072d9523e12f70f49b095bdac664249c05883491c9cee3973dbabb312` |
| `rc87-09a63ebd1fb0c985` | compiler | `46e7233b6fce53227abfda3a531079d17572bef5889c293d620a695b276267e4` | `d5cbe6647a658b9d8601cd8170c55e459bb8df5625dd48ca8d5339c155fa9f9c` |
| `rc87-3fbd82ad3f8411c4` | compiler | `70034ad7fef18ecef8f8205371580730e545a75991aae66de3c9045ff02a54a0` | `4709c086e006dda0320ceb02eb0f55b7409fbdce88ece0fb775572dd1407e2aa` |
| `rc87-d1fd372c5f354ee2` | compiler | `5029e7d6a75833c8f44009775f291c3629387e60ad597bc290320c247bc751cb` | `969b449e52cecc8f020300bb1416c3dc29fd7fb890913dd0932dd5ef12108266` |
| `rc87-fdb9f87a3f066b49` | compiler | `4e677cbf667246f9b10909792b6fda605d66096b7b17b7ecc53bf59193973652` | `c8a3d9287b9f52dd80cb615999121923fb540141a8fd9f58221c7ce51f2c89b4` |
| `rc87-ac2cdaec143ddda4` | eslint-plugin | `29bbe49e452c6661dea769245cd5394b5e351b62eb6d6e790739a22948106d25` | `ddb8588e741821e7ebde1eba836a2efe2f6a98e44c64a004887ca0a3d759f980` |
| `rc87-7c42e4a2078e5f09` | eslint-plugin | `3f57038d29e56e867ceb598478ce08cb638f9976c43fcc6f2b1883db6bff6812` | `49766a97d2498108429f2ff8cf41068ff05c2ff82eb19ce3667a39df0ad471b2` |
| `rc87-36ad6d860a2a4cc3` | language-server | `740d87cc2120be23a27a4f18ddaab0f0171ecbcbd1a4f6900b78f3adc3e35c93` | `f77fe7edd22cf7ea4b7498e243a584ad0b66fe2a64cb25308905666021b9663e` |
| `rc87-3dbeb88b8f407cb0` | language-server | `c4d59db907cccd641f421f2092264fa941eb9ba42fb397ba35fad4439f0b0f96` | `ca81ede3c884219b41514efb0673a2824952ad5918662e066e92ba9d371e4754` |
| `rc87-e5d343ae48cff114` | next | `6d323e4fae2ea145f270a4c7ecbef9d695f237e4fe427e8ee391428b0b0d374c` | `4812bbfa89cdae1e274fe4d3de6b750498a0c2a7e64037a652377474a2efb28e` |
| `rc87-dcfcbfe417ea201d` | next | `0f0f0b15669e17910a91dcb35e67c6c81c8cb62420ca80f85ef28c7605741189` | `d8497b6e1c7d66f240da75ee2257060e5b4f340aaf8a3b083cb5cc6ff819692e` |
| `rc87-f9c0eb4b3b8f2fbb` | next | `1f8b4e975fc9fec86ec18df93a2b9c9b0f6ec4f85f5ffba45275f104cae85f05` | `1721cb02a5023b7b4cabf34feef0b50d803fa4b58b68b2866cd60e320ca9a14a` |
| `rc87-55b73f1c832fdb61` | next | `3915fa8671163eb0cc144b406cdf4fd368996e749601cf822536cfe51ccf988a` | `885c6208f34a6fe859ed2517d48c45ab52b07335cd39f30cded2e00294e42970` |
| `rc87-72b32e8d8e81f786` | next | `d5f6cabf8dc7d096ec2a65806ed8d3a2bbae3a70d6055307d22157d3925faa2f` | `27113417e16999a27f662af7aabdb95f3fa71ba2358b407d63790e709c1c7959` |
| `rc87-054c879ed15dfa40` | vite | `15d2a61f201c3b8f30ea44d3381803209e8ed5dd9f9953d45648c0c8fc2482c5` | `0fbeb5a085d057f1af467a81a7099024ceaa68b02f4a2095927fdc14651d4556` |
| `rc87-41097ea300e09962` | webpack | `226c5a78758a6a22ae86848604e962780871200bef0442494153d1688e4860c2` | `6769de48065438edaa6849ecccf37a266366a5b000d191fd2ffb6b0e38486e6f` |
