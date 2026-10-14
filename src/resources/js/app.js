import './bootstrap';
import {
	createIcons, ArrowLeft, ArrowRight, ArrowUpRight, CalendarArrowUp, Check,
	CircleCheck, ClipboardCheck, LogOut, MessageCircleQuestion, MessageSquare,
	MessagesSquare, Notebook, NotebookPen, Pencil, Plus, Save, Search, Send,
	Trash2, UserRoundPlus,
} from 'lucide';

createIcons({ icons: {
	ArrowLeft, ArrowRight, ArrowUpRight, CalendarArrowUp, Check, CircleCheck,
	ClipboardCheck, LogOut, MessageCircleQuestion, MessageSquare, MessagesSquare,
	Notebook, NotebookPen, Pencil, Plus, Save, Search, Send, Trash2, UserRoundPlus,
} });

document.querySelectorAll('form[data-confirm]').forEach((form) => {
	form.addEventListener('submit', (event) => {
		if (!window.confirm(form.dataset.confirm)) event.preventDefault();
	});
});

document.querySelectorAll('form[data-dirty-check]').forEach((form) => {
	let dirty = false;
	form.addEventListener('input', () => { dirty = true; });
	form.addEventListener('submit', () => { dirty = false; });
	window.addEventListener('beforeunload', (event) => {
		if (dirty) {
			event.preventDefault();
			event.returnValue = '';
		}
	});
});
