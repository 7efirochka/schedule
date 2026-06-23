// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig(
  {
  compatibilityDate: '2026-06-03',
  css: [
    '@aprinciple/modern-reset/reset.min.css',
    'bootstrap/dist/css/bootstrap.min.css'
  ],
  modules: ['@pinia/nuxt'],

  devServer: {
    host: 'timesheet.atlas-pro24.local', // Listens on all local IP addresses
    port: 3000       // Optional: defaults to 3000
  },

  runtimeConfig: {
    wpUrl: 'http://webportal.atlas-pro24.local:3000',
    mongoUrl: 'mongodb://mongo.atlas-pro24.local:27017'
  }
})