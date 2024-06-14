<template>
    <div class="loading">
   </div>
</template>
<style>
.loading {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-left-color: red;
    animation: loading 1s infinite linear;
    margin: auto;
}

@keyframes loading {
    0% { transform: rotate(0deg) }
    100% { transform: rotate(360deg) }
}

</style>