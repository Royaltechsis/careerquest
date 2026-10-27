import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header right={<a className="btn sm" href="/">Home</a>} />
      <main id="main" className="wrap">
        <section className="narrow center"><h1>Lost the trail</h1><p className="muted">That page doesn&apos;t exist.</p><a className="btn" href="/">Go home</a></section>
      </main>
    </>
  );
}
