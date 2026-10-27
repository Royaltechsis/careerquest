import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header right={<Link className="btn sm" href="/">Home</Link>} />
      <main id="main" className="wrap">
        <section className="narrow center"><h1>Lost the trail</h1><p className="muted">That page doesn&apos;t exist.</p><Link className="btn" href="/">Go home</Link></section>
      </main>
    </>
  );
}
