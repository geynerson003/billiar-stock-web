import { APP_BRAND_NAME } from "../../../../shared/constants";

type AuthHeroProps = {
  title: string;
  description: string;
  features?: string[];
};

function BallMark() {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label={APP_BRAND_NAME}>
      <defs>
        <radialGradient id="auth-ball" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#5a3c2a" />
          <stop offset="55%" stopColor="#241a12" />
          <stop offset="100%" stopColor="#0d0906" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#auth-ball)" />
      <path
        d="M13 21.5l4.5 4.5L27 15.5"
        fill="none"
        stroke="#fdfdfd"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="14" cy="12" rx="4.5" ry="3" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="auth-hero__check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

export function AuthHero({ title, description, features }: AuthHeroProps) {
  return (
    <aside className="auth-hero">
      <div className="auth-brand">
        <span className="auth-brand__mark">
          <BallMark />
        </span>
        <span className="auth-brand__name">{APP_BRAND_NAME}</span>
      </div>

      <div className="auth-hero__body">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {features && features.length > 0 && (
        <ul className="auth-hero__features">
          {features.map((feature) => (
            <li key={feature}>
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
