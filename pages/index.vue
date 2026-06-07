<script setup>
// const { data } = await useFetch("https://dummyjson.com/users")
// const users = ref(data.value.users)

const { data } = await useFetch("/api/exmp")
</script>

<template>
    <div>
        <h2>Пользователи</h2>
        <h3 v-if="data">{{ data.mess }}</h3>
        <p v-else>Загрузка...</p>
    </div>
</template>

<style>
h1 {color: red}
</style>    