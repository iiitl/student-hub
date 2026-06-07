import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AddToHomeScreenLearnMorePage() {
  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-background to-muted/40 py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Add StudentHub to Home Screen
        </h1>
        <p className="mt-3 text-muted-foreground">
          Installing StudentHub gives you a faster, app-like experience directly
          from your phone home screen.
        </p>

        <section className="mt-8 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">What this does</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Launches StudentHub in a standalone app view.</li>
            <li>Reduces browser UI distractions for a cleaner experience.</li>
            <li>
              Opens the page you choose in your profile under &quot;Home Screen
              Launch Page&quot;.
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">How to install on Android</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            <li>Open StudentHub in Chrome.</li>
            <li>
              Tap &quot;Add to Home screen&quot; or &quot;Install app&quot; when
              prompted.
            </li>
            <li>Confirm and the app icon will appear on your home screen.</li>
          </ol>
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">How to install on iPhone</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            <li>Open StudentHub in Safari.</li>
            <li>Tap the Share icon (square with an upward arrow).</li>
            <li>Scroll and tap &quot;Add to Home Screen&quot;.</li>
            <li>Tap &quot;Add&quot; to finish.</li>
          </ol>
        </section>

        <section className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Configure your launch page</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Go to your profile and choose which page should open first when you
            launch the app from your home screen. If nothing is set, StudentHub
            opens the home page by default.
          </p>
        </section>

        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link href="/profile">Set Launch Page</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
