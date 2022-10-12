let active_div = "div01";

let buttons = document.querySelectorAll('.div-selection');
buttons.forEach((button) => {

    if (button.classList.contains('active')) {
        active_div = button.getAttribute('data-value');
    }

    button.addEventListener('click', (event) => {
        buttons.forEach((button) => {
            button.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        active_div = event.currentTarget.getAttribute('data-value');
    });

});