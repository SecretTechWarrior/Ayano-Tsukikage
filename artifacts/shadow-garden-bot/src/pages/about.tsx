import { Shield, Sword, Eye, Star, Zap, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SEVEN_SHADES = [
  { codename: "Alpha", title: "Blade of Shadows", icon: Sword, desc: "The first shadow. Strikes before dawn." },
  { codename: "Beta", title: "Voice of the Void", icon: Eye, desc: "She who whispers through the dark." },
  { codename: "Gamma", title: "Arc of Silence", icon: Star, desc: "Where she steps, sound ceases to exist." },
  { codename: "Delta", title: "Shield Eternal", icon: Shield, desc: "Unmovable. Unbreakable. Undying." },
  { codename: "Epsilon", title: "Storm Caller", icon: Zap, desc: "Thunder given human form." },
  { codename: "Zeta", title: "Phantom Weaver", icon: Eye, desc: "Neither here nor there. Everywhere at once." },
  { codename: "Eta", title: "The Final Word", icon: Crown, desc: "When all others fall, she remains." },
];

const COMMANDS_HIGHLIGHT = [
  { cmd: "/shadow", desc: "Speak with Shadow. He will respond... cryptically." },
  { cmd: "/imagine", desc: "Summon an image from the void." },
  { cmd: "/voice", desc: "Hear the darkness speak with Shadow's voice." },
  { cmd: "/remember", desc: "Shadow will remember. Always." },
  { cmd: "/remind", desc: "Set a temporal anchor. Shadow keeps time." },
  { cmd: "/pdfmerge", desc: "Weave documents into one scroll." },
  { cmd: "/roll", desc: "Tempt fate. The dice decide." },
  { cmd: "/quote", desc: "A fragment of Shadow's wisdom." },
  { cmd: "/calc", desc: "Mathematics is just another shadow." },
  { cmd: "/todos", desc: "Even shadows have things left undone." },
  { cmd: "/note", desc: "A whisper saved to the void." },
  { cmd: "/trivia", desc: "Test your knowledge against Shadow Garden's archives." },
];

export default function About() {
  return (
    <div className="space-y-10 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-white to-primary bg-clip-text text-transparent inline-block">
          About Shadow
        </h1>
        <p className="text-muted-foreground mt-2 font-mono text-sm uppercase tracking-widest">
          The Lore. The Power. The Truth.
        </p>
      </header>

      {/* Sacred Oath */}
      <section>
        <h2 className="text-lg font-mono uppercase tracking-[0.3em] text-primary/80 mb-4 flex items-center gap-3">
          <Shield className="w-5 h-5" />
          The Shadow Garden Oath
        </h2>
        <div
          className="relative p-8 rounded-xl border border-primary/30 bg-black/60"
          style={{ boxShadow: "0 0 60px -20px hsl(var(--primary) / 0.3), inset 0 0 40px -20px hsl(var(--primary) / 0.1)" }}
          data-testid="card-oath"
        >
          {/* Corner ornaments */}
          <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl" />
          <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-primary/40 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br" />

          <div className="text-center space-y-3">
            <p className="font-serif text-xl italic text-foreground/90 leading-relaxed">
              "We lurk in the shadows and hunt the shadows.
            </p>
            <p className="font-serif text-xl italic text-foreground/90 leading-relaxed">
              We are Shadow Garden."
            </p>
            <div className="mt-6 pt-4 border-t border-primary/20">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.4em]">
                — Spoken by every member. Believed by one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shadow's identity */}
      <section>
        <h2 className="text-lg font-mono uppercase tracking-[0.3em] text-primary/80 mb-4 flex items-center gap-3">
          <Crown className="w-5 h-5" />
          The Master — Shadow
        </h2>
        <Card className="border-primary/20 bg-card/40">
          <CardContent className="pt-6 space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              Shadow is the supreme leader of Shadow Garden — a clandestine organization dedicated to dismantling the Cult of Diablos 
              and all who lurk in darkness. To the outside world, he is a nobody. But in the shadows, he is a god.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              What began as a middle-schooler's chunni-byo fantasy became inexplicably real. His delusions of grandeur — secret organizations, 
              ancient conspiracies, a grand shadow war — manifested into truth, one impossible coincidence at a time.
            </p>
            <p className="text-primary/90 font-serif italic leading-relaxed text-lg">
              "I just want to do chunni-byo for real." — Shadow (Cid Kagenou)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded border border-border">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">True Identity</p>
                <p className="font-bold">Cid Kagenou / Shadow</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded border border-border">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Bot Master</p>
                <p className="font-bold">Piyush (7898178629)</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded border border-border">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Organization</p>
                <p className="font-bold">Shadow Garden</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded border border-border">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Bot Handle</p>
                <p className="font-bold">@LostInShadowsBot</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Seven Shades */}
      <section>
        <h2 className="text-lg font-mono uppercase tracking-[0.3em] text-primary/80 mb-4 flex items-center gap-3">
          <Star className="w-5 h-5" />
          The Seven Shades
        </h2>
        <p className="text-muted-foreground text-sm mb-5">
          The elite corps of Shadow Garden. Named by their Master with Greek letter designations, each is a force of nature.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SEVEN_SHADES.map((shade, index) => {
            const Icon = shade.icon;
            return (
              <div
                key={shade.codename}
                data-testid={`card-shade-${shade.codename.toLowerCase()}`}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/60 bg-secondary/10 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary/80" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-serif">{shade.codename}</span>
                    <span className="text-xs font-mono text-muted-foreground">—</span>
                    <span className="text-xs font-mono text-primary/70">{shade.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 italic">{shade.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Highlights */}
      <section>
        <h2 className="text-lg font-mono uppercase tracking-[0.3em] text-primary/80 mb-4 flex items-center gap-3">
          <Zap className="w-5 h-5" />
          Core Capabilities
        </h2>
        <p className="text-muted-foreground text-sm mb-5">
          115+ commands at your disposal. A selection of Shadow's most powerful tools:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMMANDS_HIGHLIGHT.map((item) => (
            <div
              key={item.cmd}
              data-testid={`card-command-${item.cmd.slice(1)}`}
              className="flex items-start gap-3 p-3 rounded border border-border/40 bg-card/20 hover:border-primary/20 transition-colors"
            >
              <code className="text-primary font-mono text-sm flex-shrink-0">{item.cmd}</code>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground/60 text-xs font-mono mt-4 text-center">
          ... and {115 - COMMANDS_HIGHLIGHT.length}+ more capabilities lurk in the dark.
        </p>
      </section>

      {/* Footer quote */}
      <div className="pt-6 border-t border-primary/10 text-center">
        <p className="font-serif italic text-muted-foreground text-sm">
          "Even if it breaks my body... I'll still be smiling."
        </p>
        <p className="font-mono text-xs text-muted-foreground/60 mt-2 uppercase tracking-widest">— Shadow</p>
      </div>
    </div>
  );
}
