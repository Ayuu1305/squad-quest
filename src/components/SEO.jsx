import React from "react";
import { Helmet } from "react-helmet-async";

const SEO = ({ title, description, image }) => {
  const siteTitle = "Squad Quest";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  const defaultDescription =
    "Join real-world quests, complete dailies, and level up your life with Squad Quest.";
  const metaDescription = description || defaultDescription;

  // Default image would ideally be a social card in your assets
  const metaImage = image || "/squad-quest-social.png";

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SEO;
