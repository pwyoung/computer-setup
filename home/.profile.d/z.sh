echo "`date` Z" >/tmp/z.sh.out

z (){
  cd $(cat ~/.marked_path)
}

