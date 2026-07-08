<template>
  <div>
    <h1 :class="{ 'red': isRed, 'bold': isBold }">Hello, Vue!</h1>
    <p :class="[colorClass, { 'italic': isItalic }]">This is a sample Vue template.</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isRed: true,
      isBold: false,
      isItalic: true,
      colorClass: 'blue',
      buttonClass: 'btn',
    };
  },
  methods: {
    toggleStyles() {
      this.isRed = !this.isRed;
      this.isBold = !this.isBold;
      this.isItalic = !this.isItalic;
      this.colorClass = this.colorClass === 'blue' ? 'green' : 'blue';
      this.buttonClass = this.buttonClass === 'btn' ? 'btn-active' : 'btn';
    },
  },
};
</script>