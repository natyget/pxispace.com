import Image from "next/image";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center glass rounded-2xl p-6 card-hover">
      <div className="w-24 h-24 mx-auto mb-4 relative">
        <Image
          src={icon}
          alt={title}
          fill
          className="object-contain"
          sizes="96px"
        />
      </div>
      <h3 className="text-xl font-semibold text-text-muted mb-2">{title}</h3>
      <p className="text-text-secondary/80">{description}</p>
    </div>
  );
}

