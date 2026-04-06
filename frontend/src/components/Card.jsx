export default function Card({ title, subtitle, actions, children }) {
  return (
    <section className="card">
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
