import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { getPublicPortfolio } from "@/lib/public-portfolio";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicPortfolio((await params).username);
  if (!data) return { title: "Portfolio not found · CareerQuest" };
  return { title: `${data.name}'s portfolio · CareerQuest`, description: `${data.items.length} public project${data.items.length === 1 ? "" : "s"} by ${data.name}${data.course ? ", " + data.course : ""}.` };
}

const safeLink = (l: string) => (/^https?:\/\//.test(l) ? l : "");

/** Public portfolio, rendered on the server from the database (public items only). */
export default async function PublicPortfolio({ params }: Props) {
  const data = await getPublicPortfolio((await params).username);
  if (!data) notFound();
  return (
    <>
      <Header right={<Link className="btn sm" href="/">Try CareerQuest</Link>} />
      <main id="main" className="wrap">
        <section className="pub-head">
          <span className="avatar big">{(data.name || "S")[0].toUpperCase()}</span>
          <div>
            <p className="eyebrow">Portfolio</p>
            <h1>{data.name}</h1>
            <p className="muted">{[data.course, data.uni].filter(Boolean).join(" · ")}</p>
          </div>
        </section>
        {data.items.length ? (
          <div className="pf-list">
            {data.items.map((x) => (
              <article className="pf card" key={x.id}>
                {x.career && <span className="ccard-cat">{x.career}</span>}
                <h3>{x.title || "Untitled"}</h3>
                {x.problem && <p><b>Problem.</b> {x.problem}</p>}
                {x.approach && <p><b>Approach.</b> {x.approach}</p>}
                {x.skills && (
                  <div className="skill-cloud sm">
                    {x.skills.split(",").map((k) => k.trim()).filter(Boolean).map((k) => <span className="skill" key={k}>{k}</span>)}
                  </div>
                )}
                <div className="pf-f">
                  {x.evidence && <span className="small muted">{x.evidence}</span>}
                  {safeLink(x.link) && <a className="small" href={safeLink(x.link)} target="_blank" rel="noopener noreferrer">Evidence ↗</a>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty card">No public projects yet.</p>
        )}
        <p className="muted small center">Built with CareerQuest. Simulation scores reflect practice tasks, not professional certification.</p>
      </main>
    </>
  );
}
