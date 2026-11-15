export const ResponsiveImage = ({ image, alt = '', className, sizes = '(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 360px', loading = 'lazy', ...props }) => {
  const src = typeof image === 'string' ? image : image?.image;
  if (!src) return null;
  const variants = typeof image === 'object' && image ? [
    image.image_small && `${image.image_small} 480w`,
    image.image_medium && `${image.image_medium} 960w`,
  ].filter(Boolean).join(', ') : undefined;
  return <img src={src} srcSet={variants} sizes={variants ? sizes : undefined} alt={alt} className={className} loading={loading} decoding="async" {...props} />;
};
