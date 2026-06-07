<template>
    <div>
        <header>
            <ul>
                <li>
                    <NuxtLink to = "/">Главная </NuxtLink>
                </li>
                <li>
                    <NuxtLink to = "/contact">Контакты </NuxtLink>
                </li>
                <li>
                    <NuxtLink to = "/users/606">Пользователь 606 </NuxtLink>
                </li>
            </ul>
        </header>
        <slot />

        <footer>
            <p>
                All rights reserved &copy;
            </p>
        <!-- <slot />     -->
        </footer>
    </div>
</template>