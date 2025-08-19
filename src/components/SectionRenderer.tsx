import TextLeftImageRight from "./sections/TextLeftImageRight";
import TextRightImageLeft from "./sections/TextRightImageLeft";
import Map from "./sections/Map";
import TextCentered from "./sections/TextCentered";

interface Section {
  _type: string;
  _key?: string;
  image: {
    _type: "image";
    asset: { _ref: string };
    hotspot?: { x: number; y: number };
    alt: string;
  };
  content: {
    heading: string;
    body?: any[];
    cta?: {
      text: string;
      url: string;
    };
  };
}

interface SectionRendererProps {
  sections: Section[];
}

export default function SectionRenderer({ sections }: SectionRendererProps) {
  return (
    <>
      {sections.map((section, index) => {
        const key = section._key || `section-${index}`;
        
        switch (section._type) {
          case "textLeftImageRight":
            return (
              <TextLeftImageRight 
                key={key} 
                section={section as any} 
              />
            );
            
          case "textRightImageLeft":
            return (
              <TextRightImageLeft 
                key={key} 
                section={section as any} 
              />
            );
            
          case "kaart":
            return (
              <Map 
                key={key} 
                section={section as any} 
              />
            );
            
          case "textCentered":
            return (
              <TextCentered 
                key={key} 
                section={section as any} 
              />
            );
            
          default:
            console.warn(`Unknown section type: ${section._type}`);
            return null;
        }
      })}
    </>
  );
}