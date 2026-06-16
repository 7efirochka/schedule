<script lang="ts">

const authStore = useAuthStore()
navigateTo(`calendar/${authStore.user?.id}`)

</script>