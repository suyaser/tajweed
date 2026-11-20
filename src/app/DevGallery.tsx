import { useEffect, useState, type ReactNode } from 'react'
import { parseHash } from './router'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AudioControls, BottomBar, Callout, Chip, CountBeats, EmptyState, ExampleCard, LetterTile, Page, PageHeader,
  SectionCard, SegmentedControl, StatusChip, UnitPath, STEP_ICONS,
} from '@/components/kit'
import { StepNav, type StepState } from '../screens/study/LessonShell'
import type { StepId } from '../screens/study/lessonSteps'

// Dev only (#/dev/components): every ui + kit component. The page embeds four frames (EN/AR × light/dark);
// each frame is #/dev/components?frame=1&lang=…&theme=… rendered without the shell.

export default function DevGallery({ frame }: { frame?: boolean }) {
  return frame ? <Frame /> : <Grid />
}

function Grid() {
  const [wide, setWide] = useState(false)
  const frames = [['en', 'light'], ['en', 'dark'], ['ar', 'light'], ['ar', 'dark']] as const
  return (
    <div className="flex flex-col gap-space-md p-space-md">
      <div className="flex items-center gap-space-md">
        <h1 className="text-headline-md">Components</h1>
        <SegmentedControl label="Frame width" value={wide ? 'wide' : 'phone'} onChange={(v) => setWide(v === 'wide')}
          options={[{ value: 'phone', label: 'Phone 390', icon: 'smartphone' }, { value: 'wide', label: 'Wide 1100', icon: 'desktop_windows' }]} />
      </div>
      <div className="flex flex-wrap gap-space-md">
        {frames.map(([lang, theme]) => (
          <figure key={lang + theme} className="flex flex-col gap-1">
            <figcaption className="text-label text-on-surface-variant">{lang.toUpperCase()} · {theme}</figcaption>
            <iframe title={`${lang} ${theme}`} src={`#/dev/components?frame=1&lang=${lang}&theme=${theme}`}
              className="h-[85dvh] rounded-card border border-outline-variant" style={{ width: wide ? 1100 : 390 }} />
          </figure>
        ))}
      </div>
    </div>
  )
}

function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-space-sm">
      <h2 dir="ltr" className="text-label tracking-wider text-secondary uppercase">{title}</h2>
      <div className="flex flex-col gap-space-sm">{children}</div>
    </section>
  )
}
const Row = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-space-sm">{children}</div>

const STEPS: Record<StepId, StepState> = { hear: 'done', notice: 'skipped', learn: 'current', say: 'visited', find: 'new', check: 'new', recite: 'new' }

function Frame() {
  const theme = parseHash(location.hash).params.theme
  useEffect(() => {
    if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme
  }, [theme])
  const [seg, setSeg] = useState<'list' | 'map'>('list')
  const [ex, setEx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [slow, setSlow] = useState(true)
  const [loop, setLoop] = useState(false)
  const [letter, setLetter] = useState<string | null>('ن')
  const [step, setStep] = useState<StepId>('learn')

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      <Page>
        <PageHeader en="Rules" ar="الأحكام" detail={['42 rules', '9 topics']}
          actions={<Button variant="ghost" size="icon" aria-label="Settings"><Icon name="settings" /></Button>} />

        <Sec title="StepNav (current / done / visited / not started / skipped)">
          <StepNav stateOf={(id) => (id === step ? 'current' : STEPS[id] === 'current' ? 'visited' : STEPS[id])} onGo={setStep} />
        </Sec>

        <Sec title="kit · ExampleCard + AudioControls">
          <ExampleCard index={ex} total={3} reference="الناس ٤" onPrev={() => setEx(ex - 1)} onNext={() => setEx(ex + 1)} onPick={setEx}
            controls={<AudioControls playing={playing} onPlay={() => setPlaying(!playing)} played={ex > 0 || playing} slow={slow} onSlow={() => setSlow(!slow)} loop={loop} onLoop={() => setLoop(!loop)} />}>
            <p lang="ar" dir="rtl" className="text-quran">
              مِ<mark className="rounded-md bg-focus-bg px-1.5 text-focus-ink">نْ</mark> شَرِّ
            </p>
          </ExampleCard>
        </Sec>

        <Sec title="kit · Callout">
          <Callout variant="listen-for" title="Listen for">The نْ hides into the ش with a light ghunnah.</Callout>
          <Callout variant="tip" title="Tip">Say it slowly first, then at reading speed.</Callout>
          <Callout variant="note">A note with no title.</Callout>
        </Sec>

        <Sec title="kit · SectionCard">
          <SectionCard n={1} en="What happens" ar="ما يحدث">
            When a nūn sākinah is followed by one of the 15 letters, the n is hidden with ghunnah.
          </SectionCard>
          <SectionCard n={2} en="The 15 letters" ar="حروف الإخفاء">
            <Row>{['ص', 'ذ', 'ث', 'ك', 'ج'].map((l) => <LetterTile key={l} letter={l} selected={letter === l} onClick={() => setLetter(l)} />)}</Row>
          </SectionCard>
        </Sec>

        <Sec title="kit · LetterTile · CountBeats">
          <Row>
            <LetterTile letter="ن" name="nūn" /><LetterTile letter="م" name="mīm" selected /><LetterTile letter="ق" />
          </Row>
          <Row><CountBeats min={2} /><CountBeats min={4} max={5} active={3} /><CountBeats min={2} max={6} /></Row>
        </Sec>

        <Sec title="kit · UnitPath">
          <UnitPath finale="todo" lessons={[
            { state: 'done', label: 'Lesson 1', href: '#/learn/a' }, { state: 'done', label: 'Lesson 2', href: '#/learn/b' },
            { state: 'current', label: 'Lesson 3', href: '#/learn/c' }, { state: 'todo', label: 'Lesson 4' }, { state: 'todo', label: 'Lesson 5' },
          ]} />
          <UnitPath finale="done" lessons={[{ state: 'done', label: 'Lesson 1' }, { state: 'done', label: 'Lesson 2' }]} />
        </Sec>

        <Sec title="kit · Chip · StatusChip · SegmentedControl">
          <Row>
            <Chip icon="bookmark">الفلق ٢</Chip><Chip tone="gold">مخرج</Chip><Chip tone="outline">Makhraj</Chip>
            <Chip icon="repeat" pressed={loop} onClick={() => setLoop(!loop)} label="Loop" />
          </Row>
          <Row>
            <StatusChip status="done">Known</StatusChip><StatusChip status="current">Learning</StatusChip>
            <StatusChip status="todo">Not started</StatusChip><StatusChip status="info">Due</StatusChip><StatusChip status="warning">Correction</StatusChip>
          </Row>
          <SegmentedControl label="View" value={seg} onChange={setSeg} options={[{ value: 'list', label: 'List', icon: 'list' }, { value: 'map', label: 'Map', icon: 'account_tree' }]} />
        </Sec>

        <Sec title="kit · EmptyState">
          <EmptyState icon="event_available" title="Nothing due today." action={<Button variant="secondary">Back to today</Button>}>
            Your next review is on Saturday.
          </EmptyState>
        </Sec>

        <Sec title="ui · Button (primary / secondary / tertiary / ghost / destructive; sizes)">
          <Row>
            <Button>Start lesson <Icon name="arrow_forward" size={20} rtlFlip /></Button>
            <Button variant="secondary">Model, then me</Button>
            <Button variant="tertiary">Course map</Button>
            <Button variant="ghost">Not today</Button>
            <Button variant="destructive">Reset</Button>
          </Row>
          <Row>
            <Button size="sm">Small</Button><Button size="lg">Large</Button><Button disabled>Disabled</Button>
            <Button size="icon" variant="secondary" aria-label="Play"><Icon name="play_arrow" fill /></Button>
          </Row>
        </Sec>

        <Sec title="ui · Badge · Separator · Progress · Skeleton">
          <Row>
            <Badge>Makhraj</Badge><Badge variant="primary">Ikhfāʾ</Badge><Badge variant="secondary">Unit 2</Badge>
            <Badge variant="success">Known</Badge><Badge variant="destructive">Error</Badge><Badge variant="outline">Outline</Badge>
          </Row>
          <Separator />
          <Progress value={62} />
          <Row><Skeleton className="h-6 w-32" /><Skeleton className="size-10 rounded-full" /></Row>
        </Sec>

        <Sec title="ui · Card">
          <Card>
            <CardHeader><CardTitle>Today</CardTitle><CardDescription>Lesson 3 · 15 minutes</CardDescription></CardHeader>
            <CardContent className="text-body-md">Card content.</CardContent>
            <CardFooter><Button className="w-full">Continue</Button></CardFooter>
          </Card>
        </Sec>

        <Sec title="ui · Tabs · Toggle · ToggleGroup · Tooltip">
          <Tabs defaultValue="plan">
            <TabsList><TabsTrigger value="plan">Plan</TabsTrigger><TabsTrigger value="progress">Progress</TabsTrigger></TabsList>
            <TabsContent value="plan" className="text-body-md">Plan tab.</TabsContent>
            <TabsContent value="progress" className="text-body-md">Progress tab.</TabsContent>
          </Tabs>
          <Row>
            <Toggle aria-label="Loop"><Icon name="repeat" /></Toggle>
            <Toggle variant="outline">Slower</Toggle>
            <ToggleGroup type="single" variant="outline" defaultValue="m">
              <ToggleGroupItem value="m">M</ToggleGroupItem><ToggleGroupItem value="l">L</ToggleGroupItem><ToggleGroupItem value="xl">XL</ToggleGroupItem>
            </ToggleGroup>
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Help"><Icon name="help" /></Button></TooltipTrigger>
              <TooltipContent>Help</TooltipContent>
            </Tooltip>
          </Row>
        </Sec>

        <Sec title="ui · Input · Label · Select · Switch · Checkbox · RadioGroup">
          <div className="grid gap-1.5"><Label htmlFor="g-name">Teacher's name</Label><Input id="g-name" placeholder="Shaykh …" /></div>
          <Select defaultValue="husary">
            <SelectTrigger className="w-full" aria-label="Reciter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="husary">الحصري المعلّم</SelectItem><SelectItem value="minshawi">المنشاوي</SelectItem>
            </SelectContent>
          </Select>
          <Row><Switch id="g-sw" defaultChecked /><Label htmlFor="g-sw">Tajweed colours</Label></Row>
          <Row><Checkbox id="g-cb" defaultChecked /><Label htmlFor="g-cb">Remind me</Label></Row>
          <RadioGroup defaultValue="4" className="flex gap-space-md">
            {['4', '5'].map((v) => <Row key={v}><RadioGroupItem value={v} id={`g-r${v}`} /><Label htmlFor={`g-r${v}`}>{v} counts</Label></Row>)}
          </RadioGroup>
        </Sec>

        <Sec title="ui · Accordion · ScrollArea">
          <Accordion type="single" collapsible>
            <AccordionItem value="a"><AccordionTrigger>Why two counts?</AccordionTrigger><AccordionContent>Because ghunnah is two counts.</AccordionContent></AccordionItem>
            <AccordionItem value="b"><AccordionTrigger>Sources</AccordionTrigger><AccordionContent>Tuḥfat al-Aṭfāl.</AccordionContent></AccordionItem>
          </Accordion>
          <ScrollArea className="h-24 rounded-control border border-outline-variant p-space-sm">
            {Object.keys(STEP_ICONS).map((k) => <p key={k} className="text-body-md">{k}</p>)}
          </ScrollArea>
        </Sec>

        <Sec title="ui · Sheet · Dialog">
          <Row>
            <Sheet>
              <SheetTrigger asChild><Button variant="secondary">Open sheet</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>ٱلضَّآلِّينَ · الفاتحة ٧</SheetTitle><SheetDescription>Log a correction.</SheetDescription></SheetHeader>
                <div className="px-space-lg pb-space-lg"><Button className="w-full">Save</Button></div>
              </SheetContent>
            </Sheet>
            <Dialog>
              <DialogTrigger asChild><Button variant="secondary">Open dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Reset everything?</DialogTitle><DialogDescription>This deletes your progress on this device.</DialogDescription></DialogHeader>
                <DialogFooter><Button variant="destructive">Reset</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
        </Sec>

        <Sec title="ui · Icon (rtlFlip on the arrows)">
          <Row>
            {Object.values(STEP_ICONS).map((n) => <Icon key={n} name={n} />)}
            <Icon name="arrow_forward" rtlFlip /><Icon name="chevron_right" rtlFlip /><Icon name="star" fill className="text-gold" />
          </Row>
        </Sec>

        <BottomBar><Button size="lg">Next: Notice the difference <Icon name="arrow_forward" size={20} rtlFlip /></Button></BottomBar>
      </Page>
    </div>
  )
}
