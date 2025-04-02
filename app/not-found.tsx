import Link from 'next/link'

export default function Custom404() {
  return (
    <main className="flex flex-col gap-3 items-center justify-center">
      <h1 className="text-[12rem] m-0 leading-[1] font-black text-foreground">
        4<span className="text-primary">0</span>4
      </h1>
      <p className="text-lg">Page Not Found</p>
      <p className="text-md font-semibold">
        Go back to{' '}
        <Link href={'/'} className="text-primary">
          HomePage
        </Link>
      </p>
    </main>
  )
}
