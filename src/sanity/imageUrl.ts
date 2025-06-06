import imageUrlBuilder from "@sanity/image-url";
import { client } from "./client";

interface SanityImageSource {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  // You can add 'crop' and 'hotspot' properties here if your image documents consistently include them
  // crop?: {
  //   _type: "sanity.imageCrop";
  //   bottom: number;
  //   left: number;
  //   right: number;
  //   top: number;
  // };
  // hotspot?: {
  //   _type: "sanity.imageHotspot";
  //   height: number;
  //   width: number;
  //   x: number;
  //   y: number;
  // };
}

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
