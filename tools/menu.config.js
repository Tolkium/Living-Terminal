// Settings menu for Wallpaper Engine: the source of truth for general.properties in project.json.
// Edit this file, then run: node tools/build-menu.js
// order, index and group are generated from the position here, so just put items where they should appear.
// Never rename or remove a key (Wallpaper Engine stores saved values by key); if a key really must go,
// add it to removedKeys so the build knows it was intentional.

module.exports = {
	removedKeys: [],
	groups: [
		{
			key: "themegroup",
			text: "Theme",
			items: [
				{
					"key": "theme",
					"type": "combo",
					"text": "Theme",
					"value": "dark",
					"condition": "",
					"options": [
						{
							"label": "Dark",
							"value": "dark"
						},
						{
							"label": "Light",
							"value": "light"
						},
						{
							"label": "Custom",
							"value": "custom"
						}
					]
				},
				{
					"key": "backgroundcolor",
					"type": "color",
					"text": "Background : <small>#0d1110</small>",
					"value": "0.050980392156862744 0.06666666666666667 0.06274509803921569",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "textcolor",
					"type": "color",
					"text": "Text Color : <small>#e4edea</small>",
					"value": "0.8941176470588236 0.9294117647058824 0.9176470588235294",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "newproperty1",
					"type": "text",
					"text": "<b>Note: </b> Changing colors below will affect ASCII art. ASCII art colors are picked by similarity",
					"value": false,
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "black",
					"type": "color",
					"text": "Black : #0d1110",
					"value": "0.050980392156862744 0.06666666666666667 0.06274509803921569",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-black",
					"type": "color",
					"text": "Bright Black : #5c6370",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "red",
					"type": "color",
					"text": "Red : #e06c75",
					"value": "0.8784313725490196 0.4235294117647059 0.4588235294117647",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-red",
					"type": "color",
					"text": "Bright Red : #f28b82",
					"value": "0.9490196078431372 0.5450980392156862 0.5098039215686274",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "green",
					"type": "color",
					"text": "Green : #98c379",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-green",
					"type": "color",
					"text": "Bright Green : #b1f2a7",
					"value": "0.6941176470588235 0.9490196078431372 0.6549019607843137",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "yellow",
					"type": "color",
					"text": "Yellow : #e5c07b",
					"value": "0.8980392156862745 0.7529411764705882 0.4823529411764706",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-yellow",
					"type": "color",
					"text": "Bright Yellow : #ffdd88",
					"value": "1 0.8666666666666667 0.5333333333333333",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "blue",
					"type": "color",
					"text": "Blue : #61afef",
					"value": "0.3803921568627451 0.6862745098039216 0.9372549019607843",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-blue",
					"type": "color",
					"text": "Bright Blue : #82aaff",
					"value": "0.5098039215686274 0.6666666666666666 1",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "magenta",
					"type": "color",
					"text": "Magenta : #c678dd",
					"value": "0.7764705882352941 0.47058823529411764 0.8666666666666667",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-magenta",
					"type": "color",
					"text": "Bright Magenta : #d4bfff",
					"value": "0.8313725490196079 0.7490196078431373 1",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "cyan",
					"type": "color",
					"text": "Cyan : #56b6c2",
					"value": "0.33725490196078434 0.7137254901960784 0.7607843137254902",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-cyan",
					"type": "color",
					"text": "Bright Cyan : #9aedfe",
					"value": "0.6039215686274509 0.9294117647058824 0.996078431372549",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "white",
					"type": "color",
					"text": "White : #e4edea",
					"value": "0.8941176470588236 0.9294117647058824 0.9176470588235294",
					"condition": "theme.value === \"custom\""
				},
				{
					"key": "bright-white",
					"type": "color",
					"text": "Bright White : #ffffff",
					"value": "1 1 1",
					"condition": "theme.value === \"custom\""
				},
			],
		},
		{
			key: "layout",
			text: "Layout",
			items: [
				{
					"key": "layout_direction",
					"type": "combo",
					"text": "Terminal Direction",
					"value": "vertical",
					"condition": "",
					"options": [
						{
							"label": "Vertical",
							"value": "vertical"
						},
						{
							"label": "Horizontal",
							"value": "horizontal"
						}
					]
				},
				{
					"key": "layout_position",
					"type": "combo",
					"text": "Position",
					"value": "right",
					"condition": "layout_direction.value === \"vertical\"",
					"options": [
						{
							"label": "Left",
							"value": "left"
						},
						{
							"label": "Center",
							"value": "center"
						},
						{
							"label": "Right",
							"value": "right"
						}
					]
				},
				{
					"key": "layout_alignment",
					"type": "combo",
					"text": "Alignment",
					"value": "top",
					"condition": "layout_direction.value === \"horizontal\"",
					"options": [
						{
							"label": "Top",
							"value": "top"
						},
						{
							"label": "Center",
							"value": "center"
						},
						{
							"label": "Bottom",
							"value": "bottom"
						}
					]
				},
				{
					"key": "layout_vertical_order",
					"type": "combo",
					"text": "Order",
					"value": "time",
					"condition": "",
					"options": [
						{
							"label": "Time First",
							"value": "time"
						},
						{
							"label": "Overview First",
							"value": "overview"
						}
					]
				},
				{
					"key": "layout_audio_location",
					"type": "combo",
					"text": "Audio Location",
					"value": "overview",
					"condition": "",
					"options": [
						{
							"label": "Time",
							"value": "time"
						},
						{
							"label": "Center",
							"value": "center"
						},
						{
							"label": "Overview",
							"value": "overview"
						}
					]
				},
				{
					"key": "layout_divider",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": ""
				},
				{
					"key": "hideitoobigiwarning",
					"type": "bool",
					"text": "Hide 'Terminal Too Big' Warning",
					"value": false,
					"condition": ""
				},
				{
					"key": "layout_divider2",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": ""
				},
				{
					"key": "layout_custom_margin",
					"type": "bool",
					"text": "Custom Margins",
					"value": false,
					"condition": ""
				},
				{
					"key": "shifttop",
					"type": "textinput",
					"text": "Top (px)",
					"value": "",
					"condition": "layout_custom_margin.value == true"
				},
				{
					"key": "shiftbottom",
					"type": "textinput",
					"text": "Bottom (px)",
					"value": "",
					"condition": "layout_custom_margin.value == true"
				},
				{
					"key": "shiftleft",
					"type": "textinput",
					"text": "Left (px)",
					"value": "",
					"condition": "layout_custom_margin.value == true"
				},
				{
					"key": "shiftright",
					"type": "textinput",
					"text": "Right (px)",
					"value": "",
					"condition": "layout_custom_margin.value == true"
				},
				{
					"key": "leaveemptyfordefaults",
					"type": "text",
					"text": "<small>Leave Empty for Defaults</small>",
					"value": false,
					"condition": "layout_custom_margin.value == true"
				},
			],
		},
		{
			key: "appearance",
			text: "Appearance",
			items: [
				{
					"key": "schemecolor",
					"type": "color",
					"text": "Window Scheme Color",
					"value": "0.050980392156862744 0.06666666666666667 0.06274509803921569",
					"condition": ""
				},
				{
					"key": "textsize",
					"type": "slider",
					"text": "Font Size (pt)",
					"value": 15,
					"condition": "",
					"fraction": true,
					"min": 4,
					"max": 48,
					"step": 0.1,
					"precision": 2
				},
			],
		},
		{
			key: "times",
			text: "Times",
			items: [
				{
					"key": "hidetimepanel",
					"type": "bool",
					"text": "Hide Time Panel<br><small>Also hides timers and graphs</small>",
					"value": false,
					"condition": ""
				},
				{
					"key": "dateformat",
					"type": "combo",
					"text": "Date Format",
					"value": "ddmmyyyy",
					"condition": "hidetimepanel.value === false",
					"options": [
						{
							"label": "DD/MM/YYYY",
							"value": "ddmmyyyy"
						},
						{
							"label": "MM/DD/YYYY",
							"value": "mmddyyyy"
						},
						{
							"label": "YYYY/MM/DD",
							"value": "yyyymmdd"
						}
					]
				},
				{
					"key": "timeformat",
					"type": "combo",
					"text": "Time Format",
					"value": "24",
					"condition": "hidetimepanel.value === false",
					"options": [
						{
							"label": "24 hour",
							"value": "24"
						},
						{
							"label": "12 hour",
							"value": "12"
						}
					]
				},
				{
					"key": "newproperty",
					"type": "text",
					"text": "Timezone: a zone name like <b>Europe/Berlin</b> or <b>America/Los_Angeles</b> (follows daylight saving time), or an hour offset like -7 or 5.5.<small><br>Zone list: en.wikipedia.org/wiki/List_of_tz_database_time_zones</small>",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "time0",
					"type": "bool",
					"text": "Time-0",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "clabel0",
					"type": "textinput",
					"text": "Label",
					"value": "HOME",
					"condition": "(time0.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "time1",
					"type": "bool",
					"text": "Time-1",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "clabel1",
					"type": "textinput",
					"text": "Label",
					"value": "CEST",
					"condition": "(time1.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timezone1",
					"type": "textinput",
					"text": "Timezone",
					"value": "Europe/Berlin",
					"condition": "(time1.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "time2",
					"type": "bool",
					"text": "Time-2",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "clabel2",
					"type": "textinput",
					"text": "Label",
					"value": "UTC",
					"condition": "(time2.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timezone2",
					"type": "textinput",
					"text": "Timezone",
					"value": "UTC",
					"condition": "(time2.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "time3",
					"type": "bool",
					"text": "Time-3",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "clabel3",
					"type": "textinput",
					"text": "Label",
					"value": "PST",
					"condition": "(time3.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timezone3",
					"type": "textinput",
					"text": "Timezone",
					"value": "America/Los_Angeles",
					"condition": "(time3.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "time4",
					"type": "bool",
					"text": "Time-4",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "clabel4",
					"type": "textinput",
					"text": "Label",
					"value": "IST",
					"condition": "(time4.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timezone4",
					"type": "textinput",
					"text": "Timezone",
					"value": "Asia/Kolkata",
					"condition": "(time4.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "hidetimetopdivider",
					"type": "bool",
					"text": "Hide Divider Time Top",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "hidetimebottomdivider",
					"type": "bool",
					"text": "Hide Divider Time Bottom",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "customizecolors_times",
					"type": "bool",
					"text": "Customize Colors",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "timetitlecolor",
					"type": "color",
					"text": "Title Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timelabelcolor",
					"type": "color",
					"text": "Label Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timedaytodaycolor",
					"type": "color",
					"text": "Today Color",
					"value": "0.8980392156862745 0.7529411764705882 0.4823529411764706",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timedayyesterdaycolor",
					"type": "color",
					"text": "Yesterday Color",
					"value": "0.8980392156862745 0.7529411764705882 0.4823529411764706",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timedaytomorrowcolor",
					"type": "color",
					"text": "Tomorrow Color",
					"value": "0.8980392156862745 0.7529411764705882 0.4823529411764706",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "time24color",
					"type": "color",
					"text": "24 Hour Time Color",
					"value": "0.33725490196078434 0.7137254901960784 0.7607843137254902",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timeseparatorcolor",
					"type": "color",
					"text": "Separator Color",
					"value": "0.8941176470588236 0.9294117647058824 0.9176470588235294",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "time12color",
					"type": "color",
					"text": "12 Hour Time Color",
					"value": "0.7764705882352941 0.47058823529411764 0.8666666666666667",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timeprogressbracketcolor",
					"type": "color",
					"text": "Progress Bracket Color",
					"value": "0.8941176470588236 0.9294117647058824 0.9176470588235294",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timeprogressmorningcolor",
					"type": "color",
					"text": "Progress Morning Color",
					"value": "0.3803921568627451 0.6862745098039216 0.9372549019607843",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timeprogressnooncolor",
					"type": "color",
					"text": "Progress Noon Color",
					"value": "0.8980392156862745 0.7529411764705882 0.4823529411764706",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timeprogressnightcolor",
					"type": "color",
					"text": "Progress Night Color",
					"value": "0.3803921568627451 0.6862745098039216 0.9372549019607843",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timeprogresspercentagecolor",
					"type": "color",
					"text": "Progress Percentage Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timetopdividercolor",
					"type": "color",
					"text": "Divider Time Top Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
				{
					"key": "timebottomdividercolor",
					"type": "color",
					"text": "Divider Time Bottom Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidetimepanel.value === false) && (customizecolors_times.value === true)"
				},
			],
		},
		{
			key: "timers",
			text: "Timers",
			items: [
				{
					"key": "timerstext",
					"type": "text",
					"text": "Use DD/MM/YYYY for countdowns<br>or DD/MM for repeated events",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "timer0",
					"type": "bool",
					"text": "Timer-0",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "tlabel0",
					"type": "textinput",
					"text": "Label",
					"value": "NEW_YEAR",
					"condition": "(timer0.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "tdate0",
					"type": "textinput",
					"text": "Date",
					"value": "1/1",
					"condition": "(timer0.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timer1",
					"type": "bool",
					"text": "Timer-1",
					"value": true,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "tlabel1",
					"type": "textinput",
					"text": "Label",
					"value": "YEAR_2000",
					"condition": "(timer1.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "tdate1",
					"type": "textinput",
					"text": "Date",
					"value": "1/1/2000",
					"condition": "(timer1.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timer2",
					"type": "bool",
					"text": "Timer-2",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "tlabel2",
					"type": "textinput",
					"text": "Label",
					"value": "",
					"condition": "(timer2.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "tdate2",
					"type": "textinput",
					"text": "Date",
					"value": "",
					"condition": "(timer2.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timer3",
					"type": "bool",
					"text": "Timer-3",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "tlabel3",
					"type": "textinput",
					"text": "Label",
					"value": "",
					"condition": "(timer3.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "tdate3",
					"type": "textinput",
					"text": "Date",
					"value": "",
					"condition": "(timer3.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "timer4",
					"type": "bool",
					"text": "Timer-4",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "tlabel4",
					"type": "textinput",
					"text": "Label",
					"value": "",
					"condition": "(timer4.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "tdate4",
					"type": "textinput",
					"text": "Date",
					"value": "",
					"condition": "(timer4.value == true) && (hidetimepanel.value === false)"
				},
				{
					"key": "customizecolors_timers",
					"type": "bool",
					"text": "Customize Colors",
					"value": false,
					"condition": "hidetimepanel.value === false"
				},
				{
					"key": "timertitlecolor",
					"type": "color",
					"text": "Title Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timertypecolor",
					"type": "color",
					"text": "Type Color",
					"value": "0.3803921568627451 0.6862745098039216 0.9372549019607843",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timerlabelcolor",
					"type": "color",
					"text": "Label Color",
					"value": "0.8980392156862745 0.7529411764705882 0.4823529411764706",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timerdaysleftcolor",
					"type": "color",
					"text": "Days Left Color",
					"value": "0.8784313725490196 0.4235294117647059 0.4588235294117647",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timerdayssooncolor",
					"type": "color",
					"text": "1 Day Left Color",
					"value": "0.9490196078431372 0.5450980392156862 0.5098039215686274",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timerdaystodaycolor",
					"type": "color",
					"text": "Today Color",
					"value": "0.33725490196078434 0.7137254901960784 0.7607843137254902",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timerdaysagocolor",
					"type": "color",
					"text": "Days Ago Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
				{
					"key": "timerdaysinvalidcolor",
					"type": "color",
					"text": "Invalid Color",
					"value": "0.9490196078431372 0.5450980392156862 0.5098039215686274",
					"condition": "(hidetimepanel.value === false) && (customizecolors_timers.value === true)"
				},
			],
		},
		{
			key: "graphs",
			text: "Graphs",
			items: [
				{
					"key": "hidegraphspanel",
					"type": "bool",
					"text": "Hide",
					"value": false,
					"condition": ""
				},
				{
					"key": "graphshelpernote",
					"type": "text",
					"text": "<small>Live CPU / network data needs the metrics helper. Run tools\\install-autostart.cmd once to start it with Windows. Without it graphs show mock data.</small>",
					"value": false,
					"condition": "hidegraphspanel.value === false"
				},
				{
					"key": "graph1height",
					"type": "slider",
					"text": "Graph 1 Height",
					"value": 11,
					"condition": "hidegraphspanel.value === false",
					"fraction": false,
					"min": 5,
					"max": 30,
					"step": 1
				},
				{
					"key": "graph2height",
					"type": "slider",
					"text": "Graph 2 Height",
					"value": 11,
					"condition": "hidegraphspanel.value === false",
					"fraction": false,
					"min": 5,
					"max": 30,
					"step": 1
				},
				{
					"key": "graph1spacebefore",
					"type": "slider",
					"text": "Graph 1 Space Before (ch)",
					"value": 0,
					"condition": "hidegraphspanel.value === false",
					"fraction": false,
					"min": 0,
					"max": 10,
					"step": 1
				},
				{
					"key": "graph2spacebefore",
					"type": "slider",
					"text": "Graph 2 Space Before (ch)",
					"value": 0,
					"condition": "hidegraphspanel.value === false",
					"fraction": false,
					"min": 0,
					"max": 10,
					"step": 1
				},
				{
					"key": "hidegraph1topdivider",
					"type": "bool",
					"text": "Hide Divider Graph 1 Top",
					"value": false,
					"condition": "hidegraphspanel.value === false"
				},
				{
					"key": "hidegraph1bottomdivider",
					"type": "bool",
					"text": "Hide Divider Graph 1 Bottom",
					"value": false,
					"condition": "hidegraphspanel.value === false"
				},
				{
					"key": "hidegraph2topdivider",
					"type": "bool",
					"text": "Hide Divider Graph 2 Top",
					"value": false,
					"condition": "hidegraphspanel.value === false"
				},
				{
					"key": "hidegraph2bottomdivider",
					"type": "bool",
					"text": "Hide Divider Graph 2 Bottom",
					"value": false,
					"condition": "hidegraphspanel.value === false"
				},
				{
					"key": "customizecolors_graphs",
					"type": "bool",
					"text": "Customize Colors",
					"value": false,
					"condition": "hidegraphspanel.value === false"
				},
				{
					"key": "graph1color",
					"type": "color",
					"text": "Graph 1 Window Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1bigcolor",
					"type": "color",
					"text": "Graph 1 Big Text Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1linecolor",
					"type": "color",
					"text": "Graph 1 Line Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1fillcolor",
					"type": "color",
					"text": "Graph 1 Fill Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1tooltipcolor",
					"type": "color",
					"text": "Graph 1 Tooltip Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1titlecolor",
					"type": "color",
					"text": "Graph 1 Title Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2color",
					"type": "color",
					"text": "Graph 2 Window Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2bigcolor",
					"type": "color",
					"text": "Graph 2 Big Text Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2linecolor",
					"type": "color",
					"text": "Graph 2 Line Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2fillcolor",
					"type": "color",
					"text": "Graph 2 Fill Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2tooltipcolor",
					"type": "color",
					"text": "Graph 2 Tooltip Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2titlecolor",
					"type": "color",
					"text": "Graph 2 Title Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2helpercolor",
					"type": "color",
					"text": "Graph 2 Helper Lines Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1topdividercolor",
					"type": "color",
					"text": "Divider Graph 1 Top Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph1bottomdividercolor",
					"type": "color",
					"text": "Divider Graph 1 Bottom Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2topdividercolor",
					"type": "color",
					"text": "Divider Graph 2 Top Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
				{
					"key": "graph2bottomdividercolor",
					"type": "color",
					"text": "Divider Graph 2 Bottom Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hidegraphspanel.value === false) && (customizecolors_graphs.value === true)"
				},
			],
		},
		{
			key: "audio",
			text: "Audio & Media",
			items: [
				{
					"key": "hideaudiopanel",
					"type": "bool",
					"text": "Hide",
					"value": false,
					"condition": ""
				},
				{
					"key": "showextras",
					"type": "bool",
					"text": "Show Extra Sliders (Bass/Mid/Treble)",
					"value": true,
					"condition": "hideaudiopanel.value === false"
				},
				{
					"key": "smoothness",
					"type": "slider",
					"text": "Smoothness",
					"value": 0.6,
					"condition": "hideaudiopanel.value === false",
					"fraction": true,
					"min": 0,
					"max": 0.9,
					"step": 0.1,
					"precision": 2
				},
				{
					"key": "volume_sensitivity",
					"type": "slider",
					"text": "Sensitivity",
					"value": 1,
					"condition": "hideaudiopanel.value === false",
					"fraction": true,
					"min": 0.1,
					"max": 10,
					"step": 0.1,
					"precision": 2
				},
				{
					"key": "seekbarfillchar",
					"type": "textinput",
					"text": "Seekbar Progress Character",
					"value": "=",
					"condition": "hideaudiopanel.value === false"
				},
				{
					"key": "hideaudiovisualizertopdivider",
					"type": "bool",
					"text": "Hide Divider Audio Visualizer Top",
					"value": false,
					"condition": "hideaudiopanel.value === false"
				},
				{
					"key": "hideaudiovisualizerbottomdivider",
					"type": "bool",
					"text": "Hide Divider Audio Visualizer Bottom",
					"value": false,
					"condition": "hideaudiopanel.value === false"
				},
				{
					"key": "hideaudioseekbartopdivider",
					"type": "bool",
					"text": "Hide Divider Audio Seekbar Top",
					"value": false,
					"condition": "hideaudiopanel.value === false"
				},
				{
					"key": "customizecolors_audio",
					"type": "bool",
					"text": "Customize Colors",
					"value": false,
					"condition": "hideaudiopanel.value === false"
				},
				{
					"key": "audiobracketcolor",
					"type": "color",
					"text": "Audio Brackets Color",
					"value": "1 1 1",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "audiolabelcolor",
					"type": "color",
					"text": "Audio Label Color",
					"value": "0.8941176470588236 0.9294117647058824 0.9176470588235294",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "audiotimecolor",
					"type": "color",
					"text": "Audio Time Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "mediacolumnscolor",
					"type": "color",
					"text": "Media Columns Color",
					"value": "0.6941176470588235 0.9490196078431372 0.6549019607843137",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "medianamecolor",
					"type": "color",
					"text": "Media Name Color",
					"value": "0.6941176470588235 0.9490196078431372 0.6549019607843137",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "mediastatuscolor",
					"type": "color",
					"text": "Media Status Color",
					"value": "0.6941176470588235 0.9490196078431372 0.6549019607843137",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "mediatimestampcolor",
					"type": "color",
					"text": "Media Timestamps Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "seekbarprogresscolor",
					"type": "color",
					"text": "Seekbar Progress Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "seekbartrackcolor",
					"type": "color",
					"text": "Seekbar Track Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "audiovisualizertopdividercolor",
					"type": "color",
					"text": "Divider Audio Visualizer Top Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "audiovisualizerbottomdividercolor",
					"type": "color",
					"text": "Divider Audio Visualizer Bottom Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
				{
					"key": "audioseekbartopdividercolor",
					"type": "color",
					"text": "Divider Audio Seekbar Top Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideaudiopanel.value === false) && (customizecolors_audio.value === true)"
				},
			],
		},
		{
			key: "asciiart",
			text: "ASCII Art",
			items: [
				{
					"key": "hideasciiart",
					"type": "bool",
					"text": "Hide",
					"value": false,
					"condition": ""
				},
				{
					"key": "asciiresolution",
					"type": "slider",
					"text": "Resolution (Higher = Lag)",
					"value": 50,
					"condition": "hideasciiart.value === false",
					"fraction": false,
					"min": 50,
					"max": 300,
					"step": 25
				},
				{
					"key": "usemediaart",
					"type": "bool",
					"text": "Use Media Art",
					"value": true,
					"condition": "hideasciiart.value === false"
				},
				{
					"key": "defaultimage",
					"type": "file",
					"text": "Logo",
					"value": "",
					"condition": "hideasciiart.value === false"
				},
				{
					"key": "coloredascii",
					"type": "bool",
					"text": "Colored Art",
					"value": true,
					"condition": "hideasciiart.value === false"
				},
				{
					"key": "ascii_color_mode",
					"type": "combo",
					"text": "Color Mode",
					"value": "theme",
					"condition": "(hideasciiart.value === false) && (coloredascii.value == true)",
					"options": [
						{
							"label": "Theme",
							"value": "theme"
						},
						{
							"label": "Image",
							"value": "image"
						}
					]
				},
				{
					"key": "saturation",
					"type": "slider",
					"text": "Saturation<small><br>0 = Grayscale<br>1 = Normal<br>> 1 = More Vivid</small>",
					"value": 1,
					"condition": "(hideasciiart.value === false) && (coloredascii.value == true)",
					"fraction": true,
					"min": 0,
					"max": 5,
					"step": 0.1,
					"precision": 2
				},
				{
					"key": "artbackground",
					"type": "bool",
					"text": "Background",
					"value": false,
					"condition": "hideasciiart.value === false"
				},
				{
					"key": "customizecolors_ascii",
					"type": "bool",
					"text": "Customize Colors",
					"value": false,
					"condition": "hideasciiart.value === false"
				},
				{
					"key": "ascii_static_color",
					"type": "color",
					"text": "Static Color",
					"value": "0.8941176470588236 0.9294117647058824 0.9176470588235294",
					"condition": "(hideasciiart.value === false) && (coloredascii.value == false) && (customizecolors_ascii.value === true)"
				},
				{
					"key": "artbackgroundcolor",
					"type": "color",
					"text": "Background Color",
					"value": "0.050980392156862744 0.06666666666666667 0.06274509803921569",
					"condition": "(hideasciiart.value === false) && (artbackground.value === true) && (customizecolors_ascii.value === true)"
				},
				{
					"key": "gameoflifecolor",
					"type": "color",
					"text": "Game of Life Cell Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "(hideasciiart.value === false) && (customizecolors_ascii.value === true)"
				},
				{
					"key": "gameoflifeframecolor",
					"type": "color",
					"text": "Game Of Life Frame Color",
					"value": "0.3607843137254902 0.38823529411764707 0.4392156862745098",
					"condition": "(hideasciiart.value === false) && (customizecolors_ascii.value === true)"
				},
			],
		},
		{
			key: "systeminformation",
			text: "System Information",
			items: [
				{
					"key": "hostname",
					"type": "textinput",
					"text": "Hostname",
					"value": "[USER]",
					"condition": ""
				},
				{
					"key": "ip",
					"type": "textinput",
					"text": "IP",
					"value": "192.168.0.2",
					"condition": ""
				},
				{
					"key": "os",
					"type": "textinput",
					"text": "OS",
					"value": "Windows 11",
					"condition": ""
				},
				{
					"key": "kernel",
					"type": "textinput",
					"text": "Kernel",
					"value": "10.0.26100.4656",
					"condition": ""
				},
				{
					"key": "shell",
					"type": "textinput",
					"text": "Shell",
					"value": "PowerShell 7.4",
					"condition": ""
				},
				{
					"key": "cpu",
					"type": "textinput",
					"text": "CPU",
					"value": "[CPU]",
					"condition": ""
				},
				{
					"key": "gpu",
					"type": "textinput",
					"text": "GPU",
					"value": "[GPU]",
					"condition": ""
				},
				{
					"key": "ram",
					"type": "textinput",
					"text": "RAM",
					"value": "32G",
					"condition": ""
				},
				{
					"key": "disk",
					"type": "textinput",
					"text": "Disk",
					"value": "930G",
					"condition": ""
				},
				{
					"key": "system_additional_information",
					"type": "bool",
					"text": "Additional Information",
					"value": true,
					"condition": ""
				},
				{
					"key": "system_custom_rows",
					"type": "slider",
					"text": "Custom Rows",
					"value": 11,
					"condition": "system_additional_information.value === true",
					"fraction": false,
					"min": 0,
					"max": 11,
					"step": 1
				},
				{
					"key": "system_stats_prop-1",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 1)"
				},
				{
					"key": "system_stats_value-1",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 1)"
				},
				{
					"key": "system_stats_divider-1",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 2)"
				},
				{
					"key": "system_stats_prop-2",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 2)"
				},
				{
					"key": "system_stats_value-2",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 2)"
				},
				{
					"key": "system_stats_divider-2",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 3)"
				},
				{
					"key": "system_stats_prop-3",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 3)"
				},
				{
					"key": "system_stats_value-3",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 3)"
				},
				{
					"key": "system_stats_divider-3",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 4)"
				},
				{
					"key": "system_stats_prop-4",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 4)"
				},
				{
					"key": "system_stats_value-4",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 4)"
				},
				{
					"key": "system_stats_divider-4",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 5)"
				},
				{
					"key": "system_stats_prop-5",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 5)"
				},
				{
					"key": "system_stats_value-5",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 5)"
				},
				{
					"key": "system_stats_divider-5",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 6)"
				},
				{
					"key": "system_stats_prop-6",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 6)"
				},
				{
					"key": "system_stats_value-6",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 6)"
				},
				{
					"key": "system_stats_divider-6",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 7)"
				},
				{
					"key": "system_stats_prop-7",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 7)"
				},
				{
					"key": "system_stats_value-7",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 7)"
				},
				{
					"key": "system_stats_divider-7",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 8)"
				},
				{
					"key": "system_stats_prop-8",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 8)"
				},
				{
					"key": "system_stats_value-8",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 8)"
				},
				{
					"key": "system_stats_divider-8",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 9)"
				},
				{
					"key": "system_stats_prop-9",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 9)"
				},
				{
					"key": "system_stats_value-9",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 9)"
				},
				{
					"key": "system_stats_divider-9",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 10)"
				},
				{
					"key": "system_stats_prop-10",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 10)"
				},
				{
					"key": "system_stats_value-10",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 10)"
				},
				{
					"key": "system_stats_divider-10",
					"type": "text",
					"text": "---------",
					"value": false,
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 11)"
				},
				{
					"key": "system_stats_prop-11",
					"type": "textinput",
					"text": "Property",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 11)"
				},
				{
					"key": "system_stats_value-11",
					"type": "textinput",
					"text": "Value",
					"value": "",
					"condition": "(system_additional_information.value === true) && (system_custom_rows.value >= 11)"
				},
				{
					"key": "customizecolors_system",
					"type": "bool",
					"text": "Customize Colors",
					"value": false,
					"condition": ""
				},
				{
					"key": "systeminfotitlecolor",
					"type": "color",
					"text": "System Titles Color",
					"value": "0.6941176470588235 0.9490196078431372 0.6549019607843137",
					"condition": "customizecolors_system.value === true"
				},
				{
					"key": "systeminfovaluecolor",
					"type": "color",
					"text": "System Values Color",
					"value": "0.596078431372549 0.7647058823529411 0.4745098039215686",
					"condition": "customizecolors_system.value === true"
				},
			],
		},
	],
};
