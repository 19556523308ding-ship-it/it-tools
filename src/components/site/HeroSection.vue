<script setup lang="ts">
import { RouterLink } from 'vue-router';
import ToolSearch from './ToolSearch.vue';
import { site } from '@/config/site';
import { useLang } from '@/composable/useLang';
import HeroBg from '@/assets/brand/hero-bg.svg?component';
import Orbit from '@/assets/brand/orbit.svg?component';
import LogoMark from '@/assets/brand/logo-mark.svg?component';

const { pick } = useLang();
</script>

<template>
  <section class="hero">
    <HeroBg class="hero__bg" aria-hidden="true" />

    <div class="site-container hero__inner">
      <div class="hero__content">
        <span class="hero__eyebrow">
          <icon-mdi-star-four-points />
          {{ pick(site.copy.hero.eyebrow) }}
        </span>

        <h1 class="hero__title">
          {{ pick(site.copy.hero.title) }}
        </h1>

        <p class="hero__subtitle">
          {{ pick(site.copy.hero.subtitle) }}
        </p>

        <ToolSearch class="hero__search" />

        <div class="hero__actions">
          <RouterLink to="/#all-tools" class="hero__btn hero__btn--primary">
            {{ pick(site.copy.hero.browseAll) }}
            <icon-mdi-arrow-right class="jz-arrow" />
          </RouterLink>

          <a
            :href="site.github"
            class="hero__btn hero__btn--ghost"
            target="_blank"
            rel="noopener"
          >
            <icon-mdi-github />
            {{ pick(site.copy.hero.viewGitHub) }}
          </a>
        </div>
      </div>

      <div class="hero__visual" aria-hidden="true">
        <Orbit class="jz-float-alt hero__orbit" />
        <div class="jz-float hero__logo">
          <LogoMark />
        </div>
        <span class="jz-twinkle hero__spark hero__spark--1" />
        <span class="hero__spark jz-twinkle hero__spark--2" />
        <span class="hero__spark jz-twinkle hero__spark--3" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background: var(--grad-hero);
}

.hero__bg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 48px;
  padding-top: 72px;
  padding-bottom: 72px;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid var(--border-brand);
  border-radius: var(--radius-pill);
  background-color: color-mix(in srgb, var(--bg-card) 70%, transparent);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--brand-blue);
}

.hero__title {
  margin: 20px 0 0;
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.hero__subtitle {
  margin: 18px 0 0;
  max-width: 520px;
  font-size: clamp(15px, 1.4vw, 18px);
  line-height: 1.7;
  color: var(--text-secondary);
}

.hero__search {
  margin-top: 32px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 24px;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 24px;
  border-radius: var(--radius-pill);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background-color var(--dur-base);
}

.hero__btn--primary {
  background: var(--grad-brand);
  color: #fff;
  box-shadow: var(--shadow-brand);
}

.hero__btn--primary:hover {
  transform: translateY(-2px);
}

.hero__btn--ghost {
  border: 1px solid var(--border-soft);
  background-color: var(--bg-card);
  color: var(--text-primary);
}

.hero__btn--ghost:hover {
  border-color: var(--border-brand);
  color: var(--brand-blue);
}

.hero__visual {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  min-height: 360px;
}

.hero__orbit {
  position: absolute;
  width: 340px;
  height: 340px;
}

.hero__orbit-img {
  width: 100%;
  height: 100%;
}

.hero__logo {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 168px;
  height: 168px;
  border-radius: 50%;
  background: var(--grad-brand-soft);
  box-shadow: 0 20px 60px rgb(37 99 255 / 18%);
}

.hero__spark {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--brand-lime-strong);
  box-shadow: 0 0 12px var(--brand-lime);
}

.hero__spark--1 {
  top: 12%;
  left: 18%;
}

.hero__spark--2 {
  top: 68%;
  right: 14%;
  background: var(--brand-cyan);
  box-shadow: 0 0 12px var(--brand-cyan);
}

.hero__spark--3 {
  bottom: 8%;
  left: 30%;
  width: 7px;
  height: 7px;
  background: var(--brand-blue);
  box-shadow: 0 0 10px var(--brand-blue);
}

@media (min-width: 900px) {
  .hero__inner {
    grid-template-columns: 1.1fr 0.9fr;
  }

  .hero__visual {
    display: flex;
  }
}

@media (max-width: 640px) {
  .hero__inner {
    padding-top: 48px;
    padding-bottom: 48px;
  }

  .hero__visual {
    display: flex;
    min-height: 240px;
  }

  .hero__orbit {
    width: 240px;
    height: 240px;
  }

  .hero__logo {
    width: 128px;
    height: 128px;
  }
}
</style>
