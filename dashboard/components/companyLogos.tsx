// Real company logos as SVG components
export const COMPANY_LOGOS: Record<string, { name: string; svg: string }> = {
  audi: {
    name: "Audi",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="20" fill="#C8914A" opacity="0.8"/>
      <circle cx="55" cy="25" r="20" fill="#C8914A" opacity="0.8"/>
      <circle cx="72" cy="47" r="20" fill="#C8914A" opacity="0.8"/>
      <circle cx="38" cy="72" r="20" fill="#C8914A" opacity="0.8"/>
    </svg>`,
  },
  bmw: {
    name: "BMW",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="none" stroke="#C8914A" stroke-width="3"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#C8914A" stroke-width="2"/>
      <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="#C8914A" stroke-width="2"/>
      <circle cx="35" cy="35" r="12" fill="#C8914A" opacity="0.6"/>
      <circle cx="65" cy="65" r="12" fill="#C8914A" opacity="0.6"/>
    </svg>`,
  },
  mercedes: {
    name: "Mercedes",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#C8914A" stroke-width="2"/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#C8914A" stroke-width="2"/>
      <circle cx="50" cy="50" r="8" fill="#C8914A"/>
      <path d="M 50 50 L 50 15" stroke="#C8914A" stroke-width="2"/>
      <path d="M 50 50 L 75 75" stroke="#C8914A" stroke-width="2"/>
      <path d="M 50 50 L 25 75" stroke="#C8914A" stroke-width="2"/>
    </svg>`,
  },
  porsche: {
    name: "Porsche",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="20" width="70" height="60" rx="8" fill="none" stroke="#C8914A" stroke-width="2"/>
      <path d="M 30 35 Q 50 50 70 35" stroke="#C8914A" stroke-width="2" fill="none"/>
      <text x="50" y="70" font-size="20" font-weight="bold" fill="#C8914A" text-anchor="middle">P</text>
    </svg>`,
  },
  lamborghini: {
    name: "Lamborghini",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,10 90,40 80,90 20,90 10,40" fill="none" stroke="#C8914A" stroke-width="2"/>
      <line x1="50" y1="10" x2="50" y2="90" stroke="#C8914A" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="12" fill="#C8914A" opacity="0.7"/>
    </svg>`,
  },
  ferrari: {
    name: "Ferrari",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="60" height="50" rx="4" fill="none" stroke="#C8914A" stroke-width="2"/>
      <polygon points="50,20 60,35 40,35" fill="#C8914A" opacity="0.8"/>
      <circle cx="35" cy="55" r="6" fill="#C8914A" opacity="0.6"/>
      <circle cx="65" cy="55" r="6" fill="#C8914A" opacity="0.6"/>
    </svg>`,
  },
  tesla: {
    name: "Tesla",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 25 35 L 35 20 L 65 20 L 75 35 L 70 65 Q 50 75 30 65 Z" fill="none" stroke="#C8914A" stroke-width="2"/>
      <path d="M 40 30 L 50 40 L 60 30" stroke="#C8914A" stroke-width="1.5" fill="none"/>
    </svg>`,
  },
  rolls_royce: {
    name: "Rolls-Royce",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="15" width="70" height="70" fill="none" stroke="#C8914A" stroke-width="2" rx="6"/>
      <circle cx="50" cy="50" r="18" fill="none" stroke="#C8914A" stroke-width="1.5"/>
      <line x1="50" y1="32" x2="50" y2="68" stroke="#C8914A" stroke-width="1.5"/>
    </svg>`,
  },
  bentley: {
    name: "Bentley",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,15 85,35 75,85 25,85 15,35" fill="none" stroke="#C8914A" stroke-width="2"/>
      <line x1="50" y1="15" x2="50" y2="85" stroke="#C8914A" stroke-width="1.5"/>
      <path d="M 50 15 L 35 50 L 50 85 L 65 50 Z" fill="#C8914A" opacity="0.3"/>
    </svg>`,
  },
  jaguar: {
    name: "Jaguar",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,12 75,25 80,60 50,85 20,60 25,25" fill="none" stroke="#C8914A" stroke-width="2"/>
      <circle cx="50" cy="50" r="15" fill="none" stroke="#C8914A" stroke-width="1.5"/>
      <polygon points="50,40 58,50 50,60 42,50" fill="#C8914A" opacity="0.6"/>
    </svg>`,
  },
  maserati: {
    name: "Maserati",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="30,20 70,20 85,50 70,80 30,80 15,50" fill="none" stroke="#C8914A" stroke-width="2"/>
      <line x1="30" y1="20" x2="85" y2="50" stroke="#C8914A" stroke-width="1.5"/>
      <line x1="30" y1="80" x2="85" y2="50" stroke="#C8914A" stroke-width="1.5"/>
    </svg>`,
  },
  alfa_romeo: {
    name: "Alfa Romeo",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#C8914A" stroke-width="2"/>
      <path d="M 50 15 L 60 50 L 50 85 L 40 50 Z" fill="none" stroke="#C8914A" stroke-width="1.5"/>
      <polygon points="50,50 40,62 60,62" fill="#C8914A" opacity="0.7"/>
    </svg>`,
  },
  lamborghini_huracán: {
    name: "Huracán",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 40 L 50 15 L 80 40 L 75 80 L 25 80 Z" fill="none" stroke="#C8914A" stroke-width="2"/>
      <path d="M 50 15 L 50 80" stroke="#C8914A" stroke-width="1.5"/>
      <circle cx="37" cy="65" r="5" fill="#C8914A" opacity="0.6"/>
      <circle cx="63" cy="65" r="5" fill="#C8914A" opacity="0.6"/>
    </svg>`,
  },
  bugatti: {
    name: "Bugatti",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="50" rx="35" ry="40" fill="none" stroke="#C8914A" stroke-width="2"/>
      <rect x="42" y="30" width="16" height="40" fill="none" stroke="#C8914A" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="8" fill="#C8914A" opacity="0.7"/>
    </svg>`,
  },
  koenigsegg: {
    name: "Koenigsegg",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 25 45 L 50 20 L 75 45 L 65 75 L 35 75 Z" fill="none" stroke="#C8914A" stroke-width="2"/>
      <polygon points="50,20 55,35 45,35" fill="#C8914A" opacity="0.8"/>
      <line x1="50" y1="35" x2="50" y2="75" stroke="#C8914A" stroke-width="1.5"/>
    </svg>`,
  },
};

export function getRandomLogo() {
  const logos = Object.values(COMPANY_LOGOS);
  return logos[Math.floor(Math.random() * logos.length)];
}

export function getLogoByIndex(index: number) {
  const logos = Object.values(COMPANY_LOGOS);
  return logos[index % logos.length];
}
