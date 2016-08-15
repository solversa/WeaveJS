import * as React from "react";
import * as weavejs from "weavejs";
var HBox = weavejs.ui.flexbox.HBox;
var VBox = weavejs.ui.flexbox.VBox;
var Button = weavejs.ui.Button;
const highlights = [
    {
        title: "Versatile",
        description: "WeaveJS is an adaptable architecture, capable of adjusting to different MV* framework"
    },
    {
        title: "Efficient",
        description: "Efficiently manages your application states and callbacks"
    },
    {
        title: "Scalable",
        description: "Scales with the complexity of your application"
    }
];
export default class MainSection extends React.Component {
    render() {
        return (<div style={{ flex: 1 }}>
				<VBox className="main-header" style={{ justifyContent: "center", alignItems: "center" }}>
					<div style={{ marginLeft: 20, marginRight: 20 }}>
						<HBox style={{ width: "100%" }}>
							
							<h1 className="main-title">WeaveJS</h1>
						</HBox>
						<h2>Open Source Modern Application Architecture For Building Interactive Apps.</h2>
						<HBox style={{ height: 200, alignItems: "center", width: "100%" }}>
							<HBox style={{ flex: 1, justifyContent: "space-around" }}>
								<Button className="get-started-button">Get Started</Button>
								<Button className="get-started-button" style={{ marginLeft: 100 }}>Download WeaveJS</Button>
							</HBox>
						</HBox>
					</div>
				</VBox>
				<VBox className="highlights" style={{ marginLeft: "auto", marginRight: "auto", marginTop: 20, marginBottom: 20, alignItems: "center", textAlign: "center" }}>
					<span style={{ fontSize: "1.5em", marginTop: 20, marginBottom: 20, fontWeight: "bold" }}>Why WeaveJS?</span>
					<HBox style={{ width: "100%", justifyContent: "center" }}>
						{highlights.map((highlight, index) => {
            return (<VBox key={index} style={{ width: 270, marginLeft: 25, marginRight: 25 }}>
										<span style={{ fontSize: "1.3em", fontWeight: "bold" }}>{highlight.title}</span>
										<span style={{ marginTop: 20, marginBottom: 20 }}>{highlight.description}</span>
									</VBox>);
        })}
					</HBox>
				</VBox>
			</div>);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpblNlY3Rpb24uanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvdWkvTWFpblNlY3Rpb24udHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJPQUFPLEtBQUssS0FBSyxNQUFNLE9BQU87T0FDdkIsS0FBSyxPQUFPLE1BQU0sU0FBUztBQUVsQyxJQUFPLElBQUksR0FBRyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDdEMsSUFBTyxJQUFJLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3RDLElBQU8sTUFBTSxHQUFHLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDO0FBWWxDLE1BQU0sVUFBVSxHQUFHO0lBQ2xCO1FBQ0MsS0FBSyxFQUFFLFdBQVc7UUFDbEIsV0FBVyxFQUFFLHVGQUF1RjtLQUNwRztJQUNEO1FBQ0MsS0FBSyxFQUFFLFdBQVc7UUFDbEIsV0FBVyxFQUFFLDJEQUEyRDtLQUN4RTtJQUNEO1FBQ0MsS0FBSyxFQUFFLFVBQVU7UUFDakIsV0FBVyxFQUFFLGdEQUFnRDtLQUM3RDtDQUNELENBQUM7QUFFRix5Q0FBeUMsS0FBSyxDQUFDLFNBQVM7SUFHdkQsTUFBTTtRQUVMLE1BQU0sQ0FBQyxDQUNOLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLENBQUMsRUFBQyxDQUFDLENBQ3JCO0lBQUEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQ3JGO0tBQUEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUM3QztNQUFBLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQzVCO09BQ0E7T0FBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ3ZDO01BQUEsRUFBRSxJQUFJLENBQ047TUFBQSxDQUFDLEVBQUUsQ0FBQywwRUFBMEUsRUFBRSxFQUFFLENBQ2xGO01BQUEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQ2hFO09BQUEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUMsQ0FBQyxDQUN0RDtRQUFBLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUMxRDtRQUFBLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FDMUY7T0FBQSxFQUFFLElBQUksQ0FDUDtNQUFBLEVBQUUsSUFBSSxDQUNQO0tBQUEsRUFBRSxHQUFHLENBQ047SUFBQSxFQUFFLElBQUksQ0FDTjtJQUFBLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQ3pKO0tBQUEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUN6RztLQUFBLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFDLENBQUMsQ0FDdkQ7TUFBQSxDQUNDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSztZQUMvQixNQUFNLENBQUMsQ0FDTixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FDdEU7VUFBQSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUM3RTtVQUFBLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLENBQzlFO1NBQUEsRUFBRSxJQUFJLENBQUMsQ0FDUCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBRUo7S0FBQSxFQUFFLElBQUksQ0FDUDtJQUFBLEVBQUUsSUFBSSxDQUNQO0dBQUEsRUFBRSxHQUFHLENBQUMsQ0FDTixDQUFDO0lBQ0gsQ0FBQztBQUNGLENBQUM7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuaW1wb3J0ICogYXMgd2VhdmVqcyBmcm9tIFwid2VhdmVqc1wiO1xuXG5pbXBvcnQgSEJveCA9IHdlYXZlanMudWkuZmxleGJveC5IQm94O1xuaW1wb3J0IFZCb3ggPSB3ZWF2ZWpzLnVpLmZsZXhib3guVkJveDtcbmltcG9ydCBCdXR0b24gPSB3ZWF2ZWpzLnVpLkJ1dHRvbjtcblxuZXhwb3J0IGludGVyZmFjZSBNYWluU2VjdGlvblByb3BzXG57XG5cdHJvdXRlOnN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYWluU2VjdGlvblN0YXRlXG57XG5cbn1cblxuY29uc3QgaGlnaGxpZ2h0cyA9IFtcblx0e1xuXHRcdHRpdGxlOiBcIlZlcnNhdGlsZVwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIldlYXZlSlMgaXMgYW4gYWRhcHRhYmxlIGFyY2hpdGVjdHVyZSwgY2FwYWJsZSBvZiBhZGp1c3RpbmcgdG8gZGlmZmVyZW50IE1WKiBmcmFtZXdvcmtcIlxuXHR9LFxuXHR7XG5cdFx0dGl0bGU6IFwiRWZmaWNpZW50XCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiRWZmaWNpZW50bHkgbWFuYWdlcyB5b3VyIGFwcGxpY2F0aW9uIHN0YXRlcyBhbmQgY2FsbGJhY2tzXCJcblx0fSxcblx0e1xuXHRcdHRpdGxlOiBcIlNjYWxhYmxlXCIsXG5cdFx0ZGVzY3JpcHRpb246IFwiU2NhbGVzIHdpdGggdGhlIGNvbXBsZXhpdHkgb2YgeW91ciBhcHBsaWNhdGlvblwiXG5cdH1cbl07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1haW5TZWN0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50PE1haW5TZWN0aW9uUHJvcHMsIE1haW5TZWN0aW9uU3RhdGU+XG57XG5cblx0cmVuZGVyKClcblx0e1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IHN0eWxlPXt7ZmxleDogMX19PlxuXHRcdFx0XHQ8VkJveCBjbGFzc05hbWU9XCJtYWluLWhlYWRlclwiIHN0eWxlPXt7anVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsIGFsaWduSXRlbXM6IFwiY2VudGVyXCJ9fT5cblx0XHRcdFx0XHQ8ZGl2IHN0eWxlPXt7bWFyZ2luTGVmdDogMjAsIG1hcmdpblJpZ2h0OiAyMH19PlxuXHRcdFx0XHRcdFx0PEhCb3ggc3R5bGU9e3t3aWR0aDogXCIxMDAlXCJ9fT5cblx0XHRcdFx0XHRcdFx0ey8qPGgxIGNsYXNzTmFtZT1cIm1haW4tbG9nb1wiPldlYXZlIEpTPC9oMT4qL31cblx0XHRcdFx0XHRcdFx0PGgxIGNsYXNzTmFtZT1cIm1haW4tdGl0bGVcIj5XZWF2ZUpTPC9oMT5cblx0XHRcdFx0XHRcdDwvSEJveD5cblx0XHRcdFx0XHRcdDxoMj5PcGVuIFNvdXJjZSBNb2Rlcm4gQXBwbGljYXRpb24gQXJjaGl0ZWN0dXJlIEZvciBCdWlsZGluZyBJbnRlcmFjdGl2ZSBBcHBzLjwvaDI+XG5cdFx0XHRcdFx0XHQ8SEJveCBzdHlsZT17eyBoZWlnaHQ6IDIwMCwgYWxpZ25JdGVtczogXCJjZW50ZXJcIiwgd2lkdGg6IFwiMTAwJVwifX0+XG5cdFx0XHRcdFx0XHRcdDxIQm94IHN0eWxlPXt7ZmxleDogMSwganVzdGlmeUNvbnRlbnQ6IFwic3BhY2UtYXJvdW5kXCJ9fT5cblx0XHRcdFx0XHRcdFx0XHQ8QnV0dG9uIGNsYXNzTmFtZT1cImdldC1zdGFydGVkLWJ1dHRvblwiPkdldCBTdGFydGVkPC9CdXR0b24+XG5cdFx0XHRcdFx0XHRcdFx0PEJ1dHRvbiBjbGFzc05hbWU9XCJnZXQtc3RhcnRlZC1idXR0b25cIiBzdHlsZT17e21hcmdpbkxlZnQ6IDEwMH19PkRvd25sb2FkIFdlYXZlSlM8L0J1dHRvbj5cblx0XHRcdFx0XHRcdFx0PC9IQm94PlxuXHRcdFx0XHRcdFx0PC9IQm94PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L1ZCb3g+XG5cdFx0XHRcdDxWQm94IGNsYXNzTmFtZT1cImhpZ2hsaWdodHNcIiBzdHlsZT17e21hcmdpbkxlZnQ6IFwiYXV0b1wiLCBtYXJnaW5SaWdodDogXCJhdXRvXCIsIG1hcmdpblRvcDogMjAsIG1hcmdpbkJvdHRvbTogMjAsIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsIHRleHRBbGlnbjogXCJjZW50ZXJcIn19PlxuXHRcdFx0XHRcdDxzcGFuIHN0eWxlPXt7Zm9udFNpemU6IFwiMS41ZW1cIiwgbWFyZ2luVG9wOiAyMCwgbWFyZ2luQm90dG9tOiAyMCwgZm9udFdlaWdodDogXCJib2xkXCJ9fT5XaHkgV2VhdmVKUz88L3NwYW4+XG5cdFx0XHRcdFx0PEhCb3ggc3R5bGU9e3sgd2lkdGg6IFwiMTAwJVwiLCBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIn19PlxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRoaWdobGlnaHRzLm1hcCgoaGlnaGxpZ2h0LCBpbmRleCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0XHRcdFx0XHQ8VkJveCBrZXk9e2luZGV4fSBzdHlsZT17e3dpZHRoOiAyNzAsIG1hcmdpbkxlZnQ6IDI1LCBtYXJnaW5SaWdodDogMjV9fT5cblx0XHRcdFx0XHRcdFx0XHRcdFx0PHNwYW4gc3R5bGU9e3tmb250U2l6ZTogXCIxLjNlbVwiLCBmb250V2VpZ2h0OiBcImJvbGRcIn19PntoaWdobGlnaHQudGl0bGV9PC9zcGFuPlxuXHRcdFx0XHRcdFx0XHRcdFx0XHQ8c3BhbiBzdHlsZT17e21hcmdpblRvcDogMjAsIG1hcmdpbkJvdHRvbTogMjB9fT57aGlnaGxpZ2h0LmRlc2NyaXB0aW9ufTwvc3Bhbj5cblx0XHRcdFx0XHRcdFx0XHRcdDwvVkJveD5cblx0XHRcdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdDwvSEJveD5cblx0XHRcdFx0PC9WQm94PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSJdfQ==