import InstallationGuides from './components/InstallationGuides'
import InstallationModeTabs from './components/InstallationModeTabs'
import * as documentSteps from './components/DocumentSteps'
import PackageDeclarationExample from './components/PackageDeclarationExample'
import DocumentAPIIndex from './components/DocumentAPIIndex'
import DocumentDeclaration from './components/DocumentDeclaration'
import DocumentParameters from './components/DocumentParameters'
import StylesheetExample from './components/StylesheetExample'
import DocumentDisclosure from './components/DocumentDisclosure'
import DocumentPrompt from './components/DocumentPrompt'
import AgentPrompt from './components/AgentPrompt'
import AgentOptions from './components/AgentOptions'
import AgentWorkflow from './components/AgentWorkflow'
import AgentFixExample from './components/AgentFixExample'
import AgentStyleExample from './components/AgentStyleExample'
import DocumentOptions, { DocumentOptionList, DocumentOptionEntry } from './components/DocumentOptions'
import DocumentCodeExample from './components/DocumentCodeExample'
import ToolingOptions from './components/ToolingOptions'
import ToolingExample from './components/ToolingExample'
import DemoIndex from './components/demo/DemoIndex'
import DemoFeatureSupport from './components/demo/DemoFeatureSupport'
import DemoViewTransition from './components/demo/DemoViewTransition'
import { mdxComponents } from '~/site/docs-shell/components/mdxComponents'
import dynamic from 'next/dynamic'
import type { MDXComponents } from 'mdx/types'
import * as demoComponents from './components/demo'
import * as foundationExamples from './components/demo/FoundationExamples'
import DemoPalette from './components/demo/DemoPalette'
import DemoTokenTable from './components/demo/DemoTokenTable'
import * as foundationPaint from './components/demo/FoundationPaint'
import * as foundationTypeMotion from './components/demo/FoundationTypeMotion'
import DemoThemeComparison from './components/demo/DemoThemeComparison'
import FoundationBreakpoint from './components/demo/FoundationBreakpoint'
import DemoExample from './components/demo/DemoExample'
import { DocumentCodeTable, DocumentKeyList, DocumentNamespaceTable, DocumentValueList } from './components/DocumentValues'
import DemoConfiguredExample from './components/demo/DemoConfiguredExample'
import ProjectStyleExample from './components/demo/ProjectStyleExample'
import DocumentComparison from './components/DocumentComparison'
import DocumentChoices from './components/DocumentChoices'
import MigrationGuides from './components/MigrationGuides'
import DocumentFlow from './components/DocumentFlow'
import ResourceWaterfall from './components/demo/ResourceWaterfall'
import FirstPaintComparison from './components/demo/FirstPaintComparison'
import DeliveryFlow from './components/DeliveryFlow'
import DocumentFileTree from './components/DocumentFileTree'
import PackageTree from './components/PackageTree'
import PackageAuthoringExample from './components/demo/PackageAuthoringExample'
import {
  BenchmarkBars,
  BenchmarkChartGroup,
  BenchmarkDataTable,
  BenchmarkSource,
  BenchmarkDelta,
  BenchmarkFigure,
  BenchmarkMetrics,
  BenchmarkSampleSummary,
  BenchmarkStackedBars
} from './components/benchmarks'

const Class2CSS = dynamic(() => import('./components/Class2CSS'))

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    InstallationModeTabs,
    BenchmarkBars,
    BenchmarkChartGroup,
    BenchmarkDataTable,
    BenchmarkSource,
    BenchmarkDelta,
    BenchmarkFigure,
    BenchmarkMetrics,
    BenchmarkSampleSummary,
    BenchmarkStackedBars,
    Class2CSS: (props: any) => <Class2CSS {...props} />,
    ...mdxComponents,
    ...demoComponents,
    ...documentSteps,
    ...foundationExamples,
    FoundationBreakpoint,
    DemoThemeComparison,
    DemoPalette,
    DemoTokenTable,
    DocumentKeyList,
    DocumentNamespaceTable,
    DocumentValueList,
    DocumentCodeTable,
    DocumentComparison,
    DocumentPrompt,
    AgentPrompt,
    AgentOptions,
    AgentWorkflow,
    AgentFixExample,
    AgentStyleExample,
    DocumentOptions,
    DocumentOptionList,
    DocumentOptionEntry,
    DocumentParameters,
    DocumentAPIIndex,
    DocumentDeclaration,
    PackageDeclarationExample,
    StylesheetExample,
    DocumentDisclosure,
    DocumentCodeExample,
    ToolingOptions,
    ToolingExample,
    DocumentChoices,
    InstallationGuides,
    MigrationGuides,
    DocumentFlow,
    ResourceWaterfall,
    FirstPaintComparison,
    DeliveryFlow,
    DocumentFileTree,
    PackageTree,
    PackageAuthoringExample,
    DemoIndex,
    DemoFeatureSupport,
    DemoViewTransition,
    DemoConfiguredExample,
    ProjectStyleExample,
    ...foundationPaint,
    ...foundationTypeMotion,
    // Keep established Guide MDX demonstrations on their original primitives.
    Demo: mdxComponents.Demo,
    DemoPanel: mdxComponents.DemoPanel,
    DemoP: mdxComponents.DemoP,
    DemoLabel: mdxComponents.DemoLabel,
    BrowserHeader: mdxComponents.BrowserHeader,
    IFrame: mdxComponents.IFrame,
    HelloWorld: mdxComponents.HelloWorld,
    DemoExample,
    ...components,
  }
}
