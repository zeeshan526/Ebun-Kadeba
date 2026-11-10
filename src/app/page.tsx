import { EbunStage } from "@/components/scene/ebun-stage";
import { NotifyForm } from "@/components/notify-form";

const LINKEDIN_URL = "https://www.linkedin.com/in/ebun-kadeba-1465391b0/";

function Stamp() {
  return (
    <div className="stamp" role="img" aria-label="Coming soon">
      <svg viewBox="0 0 200 200">
        <defs>
          <path id="ring" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="#ec4899" />
        <text fontWeight="700" fontSize="21" letterSpacing="5" fill="#fff" className="font-sans">
          <textPath href="#ring" textLength="440" lengthAdjust="spacing">
            COMING SOON · COMING SOON ·
          </textPath>
        </text>
        <circle cx="100" cy="100" r="40" fill="#fff" />
        <text x="100" y="114" textAnchor="middle" fontWeight="800" fontSize="40" fill="#be185d" className="font-sans">
          ek
        </text>
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <EbunStage />
      <div className="veil" />

      <main className="intro">
        <p className="hello">Hi, I’m</p>
        <h1>Dr Ebun Kadeba</h1>
        <p className="role">FY1 Resident Doctor · NHS</p>
        <p className="lede">
          I’ve been quietly building a little corner of the internet that’s mine. It opens soon.
        </p>
        <NotifyForm />
        <p className="hint">
          <span className="scene-hint">Drag the scene to walk around her. · </span>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
            Say hello on LinkedIn
          </a>
        </p>
      </main>

      <Stamp />
    </>
  );
}
