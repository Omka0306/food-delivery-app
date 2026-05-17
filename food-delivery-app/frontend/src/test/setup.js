import '@testing-library/jest-dom'

// jsdom doesn't implement layout APIs
window.HTMLElement.prototype.scrollIntoView = function () {}
window.HTMLElement.prototype.scrollTo = function () {}
window.HTMLElement.prototype.scrollBy = function () {}
