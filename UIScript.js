const optHideBtn = document.getElementById('option-hide');
const optOpenBtn = document.getElementById('option-open');
const optionsCont = document.getElementById('options-container');
const headerRigntCont = document.getElementById('header-hopt-right-container');


const filterHideBtn = document.getElementById('filter-hide');
const filterOpenBtn = document.getElementById('filter-open');
const filterCont = document.getElementById('filter-container');
const headerLeftCont = document.getElementById('header-hfilter-left-container');


optHideBtn.addEventListener('click', () => {
  optionsCont.classList.add('hide');
  headerRigntCont.classList.add('open');
});
optOpenBtn.addEventListener('click', () => {
  optionsCont.classList.remove('hide');
  headerRigntCont.classList.remove('open');
});

filterHideBtn.addEventListener('click', () => {
  filterCont.classList.add('hide');
  headerLeftCont.classList.add('open');
});
filterOpenBtn.addEventListener('click', () => {
  filterCont.classList.remove('hide');
  headerLeftCont.classList.remove('open');
});

const optionsOpen = document.getElementById('option-open');

document.addEventListener('DOMContentLoaded', () => {
  const svgMap = {
    or:    document.getElementById('--or'),
    exclude: document.getElementById('--exclude'),
    and:   document.getElementById('--and')
  };
  
  const states = ['none', 'or', 'exclude', 'and'];
  
  document.querySelectorAll('.filter-body label').forEach(label => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    const indicatorContainer = document.createElement('span');
    indicatorContainer.className = 'indicator-container';
    label.prepend(indicatorContainer);


    label.dataset.state = 'none';
	checkbox.checked = false;


    label.addEventListener('click', e => {
      e.preventDefault();
	  const nextIndex = (states.indexOf(label.dataset.state) + 1) % states.length;
	  const nextState = states[nextIndex];

      indicatorContainer.innerHTML = '';

      
      if (nextState !== 'none') {
        const orig = svgMap[nextState];
        if (orig) {
          const clone = orig.cloneNode(true);
          clone.removeAttribute('id');
          indicatorContainer.appendChild(clone);
        }
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }

      label.dataset.state = nextState;
    });
  });
  
  const filterClearBtn = document.getElementById('filter-reset');
  
  filterClearBtn.addEventListener('click', () => {
	document.querySelectorAll('.filter-body label').forEach(label => {
	  const indicatorContainer = label.querySelector('.indicator-container');
	  const checkbox = label.querySelector('input[type="checkbox"]');
	  indicatorContainer.innerHTML = '';
	  checkbox.checked = false;
	  label.dataset.state = 'none';
	});
  });
});