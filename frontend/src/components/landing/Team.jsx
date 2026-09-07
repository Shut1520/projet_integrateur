import React from 'react';
import { User } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const members = [
  {
    name: 'Emmanuel Gilwandji',
    role: 'Responsable produit',
    photo: null,
  },
  {
    name: 'Giovanni Masiala',
    role: 'Ingénieur logiciel',
    photo: null,
  },
  {
    name: 'Olela Daisy',
    role: 'Spécialiste IoT',
    photo: null,
  },
  {
    name: 'Kasambayi Gold',
    role: 'Opérations',
    photo: null,
  },
  {
    name: 'Alexandre Gaviao',
    role: 'Design produit',
    photo: null,
  },
];

function Avatar({ photo, name }) {
  if (photo) {
    return (
      <div className="team-avatar-final">
        <img src={photo} alt={name} />
      </div>
    );
  }

  return (
    <div
      className="team-avatar-final team-avatar-placeholder-final"
      aria-label={`Photo de ${name}`}
    >
      <User size={28} strokeWidth={1.8} />
    </div>
  );
}

export default function Team() {
  return (
    <div className="team-section-final">
      <ScrollReveal />

      <div
        className="team-heading-final scroll-reveal sr-title"
        data-idx="0"
      >
        <h2>Notre Équipe</h2>
      </div>

      <p
        className="team-subtitle-final scroll-reveal"
        data-idx="1"
      >
        Les visages derrière l'innovation agricole
      </p>

      <div className="team-grid-final">
        {members.map((member, index) => (
          <article
            key={member.name}
            className="team-card-final scroll-reveal"
            data-idx={index}
          >
            <Avatar
              photo={member.photo}
              name={member.name}
            />

            <div className="team-info-final">
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}