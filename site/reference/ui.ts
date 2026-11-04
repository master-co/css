/** Short interface labels. Article prose belongs in the corresponding local MDX. */
const labels = {
  classes: ['Classes', '類別', 'クラス', '클래스', '类'],
  values: ['Values', '值', '値', '값', '值'],
  usage: ['Usage', '用法', '使用例', '사용 예', '用法'],
  customize: ['Customize', '自訂', 'カスタマイズ', '사용자 정의', '自定义'],
  class: ['Class', '類別', 'クラス', '클래스', '类'],
  property: ['Property', '屬性', 'プロパティ', '속성', '属性'],
  declarations: ['Declarations', '宣告', '宣言', '선언', '声明'],
  variable: ['Variable', '變數', '変数', '변수', '变量'],
  value: ['Value', '值', '値', '값', '值'],
  size: ['Size', '大小', 'サイズ', '크기', '大小'],
  lineHeight: ['Line height', '行高', '行の高さ', '줄 높이', '行高'],
  letterSpacing: ['Letter spacing', '字距', '文字間隔', '자간', '字距'],
  light: ['Light', '淺色', 'ライト', '라이트', '浅色'],
  dark: ['Dark', '深色', 'ダーク', '다크', '深色'],
  prefix: ['Prefix', '前綴', '接頭辞', '접두사', '前缀'],
  namespace: ['Token namespace', 'Token 命名空間', 'トークンの名前空間', '토큰 네임스페이스', '令牌命名空间'],
  properties: ['Properties', '屬性', 'プロパティ', '속성', '属性'],
  suffix: ['Suffix', '後綴', '接尾辞', '접미사', '后缀'],
  expandedQuery: ['Expanded query', '展開後的查詢', '展開後のクエリー', '확장된 쿼리', '展开后的查询'],
  moreClasses: ['{count} more classes', '其他 {count} 個類別', 'その他のクラス（{count} 件）', '클래스 {count}개 더 보기', '其他 {count} 个类'],
  moreColorFamilies: ['{count} other color families', '其他 {count} 個色彩家族', 'その他のカラーファミリー（{count} 件）', '다른 색상 계열 {count}개', '其他 {count} 个颜色族'],
  moreFunctions: ['{count} more functions', '其他 {count} 個函式', 'その他の関数（{count} 件）', '함수 {count}개 더 보기', '其他 {count} 个函数'],
  allDefinitions: ['All {count} definitions', '全部 {count} 個定義', 'すべての定義（{count} 件）', '정의 {count}개 모두 보기', '全部 {count} 个定义'],
  see: ['See', '另見', '関連項目：', '관련 문서:', '另见'],
  and: [' and ', '與', '、', ', ', '与'],
  valuesIn: ['Values in', '值請見', '値の一覧：', '값 목록:', '值见'],
  otherFamilies: ['Other families', '其他家族', 'その他のファミリー', '다른 계열', '其他族'],
  resolution: ['Resolution boundaries', '解析邊界', '解決の境界', '해석 경계', '解析边界'],
  readFamily: ['Read a family', '閱讀家族對照表', 'ファミリー表の読み方', '계열 표 읽기', '阅读族对照表'],
  media: ['Media conditions', '媒體條件', 'メディア条件', '미디어 조건', '媒体条件'],
  container: ['Container conditions', '容器條件', 'コンテナー条件', '컨테이너 조건', '容器条件'],
  sameName: ['Same name, different scope', '名稱相同，範圍各自獨立', '同じ名前でもスコープは独立', '같은 이름, 다른 범위', '名称相同，作用域各自独立'],
  themeDirectives: ['theme directives', '主題指令', 'テーマのディレクティブ', '테마 지시문', '主题指令'],
  utilityDefinitions: ['utility definitions', 'utility 定義', 'ユーティリティの定義', '유틸리티 정의', '工具类定义'],
  registration: ['token registration and resolution', 'token 註冊與解析', 'トークンの登録と解決', '토큰 등록 및 해석', '令牌注册与解析'],
  declarationForms: ['declaration forms', '宣告形式', '宣言の形式', '선언 형식', '声明形式'],
  buildingTheme: ['building a theme', '建立主題', 'テーマの作成', '테마 만들기', '创建主题'],
  grammar: ['condition grammar', '條件語法', '条件の構文', '조건 문법', '条件语法'],
  conditionScope: ['condition definition scope', '條件定義範圍', '条件定義のスコープ', '조건 정의 범위', '条件定义作用域'],
  queryDefinitions: ['query definitions', '查詢定義', 'クエリーの定義', '쿼리 정의', '查询定义'],
  containerTokens: ['container sizing tokens', '容器尺寸 token', 'コンテナーサイズのトークン', '컨테이너 크기 토큰', '容器尺寸令牌'],
  responsive: ['Responsive design', '響應式設計', 'レスポンシブデザイン', '반응형 디자인', '响应式设计'],
  radiusScale: ['Compare all radius values', '比較全部圓角值', 'すべての角丸の値を比較', '모든 모서리 반경 값 비교', '比较全部圆角值'],
  shadowScale: ['Compare all shadow values', '比較全部陰影值', 'すべてのシャドウの値を比較', '모든 그림자 값 비교', '比较全部阴影值'],
  animationScale: ['Compare all animations', '比較全部動畫', 'すべてのアニメーションを比較', '모든 애니메이션 비교', '比较全部动画'],
  durationScale: ['Compare all durations', '比較全部持續時間', 'すべての継続時間を比較', '모든 지속 시간 비교', '比较全部持续时间'],
  easingScale: ['Compare all easing curves', '比較全部緩動曲線', 'すべてのイージング曲線を比較', '모든 이징 곡선 비교', '比较全部缓动曲线'],
  familyScale: ['Compare all font families', '比較全部字型家族', 'すべてのフォントファミリーを比較', '모든 글꼴 계열 비교', '比较全部字体族'],
  fontSizeScale: ['Compare all font sizes', '比較全部字型大小', 'すべてのフォントサイズを比較', '모든 글꼴 크기 비교', '比较全部字号'],
  fontWeightScale: ['Compare all font weights', '比較全部字重', 'すべてのウェイトを比較', '모든 글꼴 굵기 비교', '比较全部字重'],
  textScale: ['Compare all text treatments', '比較全部文字樣式', 'すべてのテキストスタイルを比較', '모든 텍스트 스타일 비교', '比较全部文本样式'],
  leadingScale: ['Compare all line heights', '比較全部行高', 'すべての行の高さを比較', '모든 줄 높이 비교', '比较全部行高'],
  trackingScale: ['Compare all tracking values', '比較全部字距', 'すべての文字間隔を比較', '모든 자간 값 비교', '比较全部字距'],
  publicEntrypoints: ['Public entrypoints', '公開進入點', '公開エントリーポイント', '공개 진입점', '公开入口'],
  projectSettings: ['Project settings', '專案設定', 'プロジェクト設定', '프로젝트 설정', '项目配置'],
  parameters: ['Parameters', '參數', 'パラメーター', '매개변수', '参数'],
  exports: ['Exports', '匯出', 'エクスポート', '내보내기', '导出'],
  inputSchema: ['Complete input schema', '完整輸入結構', '入力スキーマ全体', '전체 입력 스키마', '完整输入结构'],
  outputSchema: ['Complete output schema', '完整輸出結構', '出力スキーマ全体', '전체 출력 스키마', '完整输出结构'],
  commandHelp: ['Complete command help', '完整指令說明', 'コマンドヘルプ全体', '전체 명령어 도움말', '完整命令帮助'],
} as const

export type ReferenceLabel = keyof typeof labels
export function referenceLabel(locale: string, key: ReferenceLabel, values: Record<string, string | number> = {}) {
  const index = ['en', 'tw', 'ja', 'ko', 'cn'].indexOf(locale)
  if (index < 0) throw new Error(`Unknown Reference locale: ${locale}`)
  return labels[key][index].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`))
}

const headerKeys: Record<string, ReferenceLabel> = {
  Class: 'class', Property: 'property', Declarations: 'declarations', Variable: 'variable', Value: 'value',
  Size: 'size', 'Line height': 'lineHeight', 'Letter spacing': 'letterSpacing', Light: 'light', Dark: 'dark',
  Prefix: 'prefix', 'Token namespace': 'namespace', Properties: 'properties', Suffix: 'suffix', 'Expanded query': 'expandedQuery',
}
export const referenceHeader = (locale: string, header: string) => {
  const key = headerKeys[header]
  if (!key) throw new Error(`Unknown Reference table header: ${header}`)
  return referenceLabel(locale, key)
}

/** The build audit snapshots the same labels that HTML and portable tables render. */
export const referenceUiCopy = (locale: string) => Object.fromEntries((Object.keys(labels) as ReferenceLabel[]).map(key => [key, referenceLabel(locale, key)]))
