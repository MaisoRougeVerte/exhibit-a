type InvestigatorSpriteProps = {
  idle: string;
  talk: string | undefined;
  mouthOpen: boolean;
  alt: string;
};

export function InvestigatorSprite({ idle, talk, mouthOpen, alt }: InvestigatorSpriteProps) {
  return (
    <span className="relative inline-block h-full shrink-0">
      <img src={idle} alt={alt} className="h-full max-w-none object-contain object-bottom" />
      {/* Clip to the mouth so small generation differences cannot make the body flicker. */}
      {talk !== undefined && (
        <img
          src={talk}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-contain [clip-path:inset(27%_49%_67%_43%)]"
          style={{ opacity: mouthOpen ? 1 : 0 }}
        />
      )}
    </span>
  );
}
