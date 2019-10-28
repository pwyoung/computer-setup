(function() {
  var UIFontSize;

  UIFontSize = 12;

  atom.commands.add('atom-workspace', {
    'ui:increase-font-size': function() {
      UIFontSize += 1;
      return document.documentElement.style.fontSize = UIFontSize + 'px';
    },
    'ui:decrease-font-size': function() {
      UIFontSize -= 1;
      return document.documentElement.style.fontSize = UIFontSize + 'px';
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nL2dpdC9wd3lvdW5nL2NvbXB1dGVyLXNldHVwL2dlbmVyaWMvZG90X2F0b20vaW5pdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBOztFQUFBLFVBQUEsR0FBYTs7RUFDYixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQ0U7SUFBQSx1QkFBQSxFQUF5QixTQUFBO01BQ3ZCLFVBQUEsSUFBYzthQUNkLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFFBQS9CLEdBQTBDLFVBQUEsR0FBYTtJQUZoQyxDQUF6QjtJQUdBLHVCQUFBLEVBQXlCLFNBQUE7TUFDdkIsVUFBQSxJQUFjO2FBQ2QsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsUUFBL0IsR0FBMEMsVUFBQSxHQUFhO0lBRmhDLENBSHpCO0dBREY7QUFEQSIsInNvdXJjZXNDb250ZW50IjpbIiNodHRwczovL3d3dy5nb29nbGUuY29tL3NlYXJjaD9jbGllbnQ9ZmlyZWZveC1iLTEtZCZxPXBsYXRmb3JtaW8taWRlLXRlcm1pbmFsK2hpZGUra2V5YmluZGluZ1xuVUlGb250U2l6ZSA9IDEyXG5hdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAndWk6aW5jcmVhc2UtZm9udC1zaXplJzogLT5cbiAgICBVSUZvbnRTaXplICs9IDFcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBVSUZvbnRTaXplICsgJ3B4J1xuICAndWk6ZGVjcmVhc2UtZm9udC1zaXplJzogLT5cbiAgICBVSUZvbnRTaXplIC09IDFcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBVSUZvbnRTaXplICsgJ3B4J1xuIl19
