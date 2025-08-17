interface MapProps {
  section: {
    _type: "kaart";
    heading?: string;
  };
}

export default function Map({ section }: MapProps) {
  return (
    <section className="col-span-full grid grid-cols-subgrid gap-y-6">
      {section.heading && (
        <header className="hidden col-span-full">
          <h2>{section.heading}</h2>
        </header>
      )}

      <div className="col-span-full">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2494.7701096004157!2d4.5515631767177185!3d51.296954526055174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c4079edda859cd%3A0xc9fca4c624e41481!2sAssymo%20Tuinconstructies%20op%20maat!5e0!3m2!1sen!2sbe!4v1751622544119!5m2!1sen!2sbe"
          width="100%"
          height="450"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Assymo Tuinconstructies op maat location"
        />
      </div>
    </section>
  );
}
