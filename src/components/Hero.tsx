import './Hero.css';

interface HeroProps {
  totalKbli: number;
  loading: boolean;
}

export function Hero({ totalKbli, loading }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-dot" />
          Data resmi KBLI 2025 • Konversi dari KBLI 2020
        </div>

        <h1 className="hero-title">
          Temukan Kode <span className="gradient-text">KBLI 2025</span>
          <br />
          Usaha Anda dengan Cepat
        </h1>

        <p className="hero-subtitle">
          Database lengkap {loading ? '…' : `${totalKbli.toLocaleString('id-ID')}+`} klasifikasi
          lapangan usaha Indonesia. Pencarian instan, detail skala risiko, perizinan, dan
          AI Assistant untuk membantu Anda menentukan kode yang tepat.
        </p>

        <div className="hero-features">
          <div className="feature-pill">
            <span>⚡</span> Pencarian Instan
          </div>
          <div className="feature-pill">
            <span>🤖</span> AI Assistant
          </div>
          <div className="feature-pill">
            <span>📊</span> Skala & Risiko
          </div>
          <div className="feature-pill">
            <span>🔄</span> Konversi 2020
          </div>
        </div>
      </div>
    </section>
  );
}
