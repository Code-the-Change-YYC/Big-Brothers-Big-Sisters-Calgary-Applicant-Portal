<template>
  <v-footer
    display="flex"
    color="primary"
    class="d-flex flex-wrap mb-6"
    padding-left="1rem"
    padding-right="1rem"
  >
    <v-row
      justify="center"
      class="d-flex flex-wrap"
      no-gutters
    >
    <v-row>
      <v-btn
        v-for="(link, index) in links"
        :key=index
        :href="link.href"
        target="_blank"
        text
        rounded
      >
        {{ link.text }}
      </v-btn>
    </v-row>
    </v-row>
  </v-footer>
</template>

<script>
  export default {
    data: () => ({
      links: [
        {
          text: 'Home',
          href: 'https://www.bbbscalgary.ca'
        },
        {
          text: 'Complaints Policy',
          href: 'https://bbbscalgary.ca/complaints-policy/'
        },
        {
          text: 'Diversity and Inclusion Policy',
          href: 'https://bbbscalgary.ca/diversity-inclusion-policy/'
        },
        {
          text: 'Privacy',
          href: 'https://bbbscalgary.ca/privacy-policy/'
        },
        {
          text : 'Help',
          href: 'tel: 403-777-3534'
        }
      ],
    }),
  }
</script>
<style scoped>
.v-btn__content { width: 100%; white-space: normal; }
</style>